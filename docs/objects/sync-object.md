# 同步对象

**同步对象（Sync Object）** 用于在 GPU 和应用程序之间进行同步。虽然 `glFinish` 提供了基本的同步功能，但同步对象提供了更精细的控制。

| 属性 | 值 |
|-----|-----|
| 核心版本 | 4.6 |
| 引入版本 | 3.2 |
| 核心扩展 | [ARB_sync](https://www.opengl.org/registry/specs/ARB/sync.txt) |
| 厂商扩展 | [NV_fence](https://www.opengl.org/registry/specs/NV/fence.txt) |

## 同步对象约定

同步对象不遵循标准的 OpenGL 对象模型：

- 常规 OpenGL 对象使用 `GLuint` 名称
- 同步对象定义为指向不透明类型的指针：

```cpp
typedef struct __GLsync *GLsync;
```

每个同步对象类型有独特的创建函数，都创建 `GLsync` 对象。这些对象不使用 `glGen*/glDelete*` 函数对，而是使用通用的 `glDeleteSync` 删除。

::: warning
同步对象从不绑定到上下文，也不像常规 GL 对象那样封装状态。它们**不是** OpenGL 对象。
:::

## 同步机制

同步对象的目的是协调 CPU 与 GPU 的操作。同步对象具有当前状态的概念：**已触发（signaled）** 或 **未触发（unsignaled）**，表示 GPU 的某种条件。

### 阻塞等待

阻塞 CPU 直到同步对象被触发：

```cpp
GLenum glClientWaitSync(GLsync sync, GLbitfield flags, GLuint64 timeout)
```

此函数在以下情况返回：
- `sync` 对象变为已触发状态
- 超过 `timeout` 纳秒（超时值为零时立即检查并返回）

**返回值说明：**

| 返回值 | 含义 |
|-------|------|
| `GL_ALREADY_SIGNALED` | 调用前已触发 |
| `GL_TIMEOUT_EXPIRED` | 超时期间未触发 |
| `GL_CONDITION_SATISFIED` | 超时期间触发 |
| `GL_WAIT_FAILED` | 发生错误 |

`flags` 参数控制命令队列刷新。传递 `GL_SYNC_FLUSH_COMMANDS_BIT` 会在阻塞前执行等效于 `glFlush` 的操作，防止 GPU 命令队列过满导致无限等待。

### GPU 端等待

```cpp
void glWaitSync(GLsync sync, GLbitfield flags, GLuint64 timeout)
```

`glWaitSync` 阻止驱动程序将任何命令添加到 GPU 命令队列，直到同步对象被触发。此函数**不会**阻塞 CPU。

::: warning
`glWaitSync` 不接受 `GL_SYNC_FLUSH_COMMANDS_BIT`，需要手动调用 `glFlush`。必须确保同步对象已进入 GPU 命令队列，否则可能造成死锁。
:::

### 刷新与上下文

同步对象必须正确刷新到 GPU 命令队列，否则可能永远不会被触发。

::: info 重要
刷新是上下文特定的操作，必须在创建同步对象的同一上下文中执行刷新。

在 OpenGL 4.5 中，通过 `glClientWaitSync` 传递 `GL_SYNC_FLUSH_COMMANDS_BIT` 的首次等待会特殊处理——刷新行为如同在同步对象创建后立即发出。
:::

首次等待后，无需再次刷新管道以确保同步对象被触发。多次等待同一同步对象时，不应再次使用刷新位（GL 4.5 同一线程中自动处理）。

## 同步对象类型

同步对象具有特定类型，定义其触发行为。目前只有一种类型：栅栏。

### 栅栏

**栅栏（Fence）** 是添加到 OpenGL 命令流的同步对象。它初始为未触发状态，当 GPU 执行并完成栅栏时变为已触发。

创建栅栏：

```cpp
GLsync glFenceSync(GLenum condition, GLbitfield flags)
```

此函数不仅创建栅栏，还将其**添加**到命令流中。

**参数说明：**
- `condition`：唯一可用值为 `GL_SYNC_GPU_COMMANDS_COMPLETE`，表示 GPU 完成所有先前命令后触发
- `flags`：目前必须为 0，保留供未来扩展

::: tip 应用场景
栅栏在命令**完成**后触发（而非开始），可用于：
- 确认 GPU 已完成使用某些资源
- 等待像素缓冲或变换反馈缓冲数据就绪
- 异步资源管理
:::

## 历史兼容

NVIDIA 硬件很早就提供了 [NV_fence](https://www.opengl.org/registry/specs/NV/fence.txt) 扩展（GeForce 256 时代），提供类似栅栏同步对象的功能，但使用不同的 API。

## 参考

- [Core API Ref Synchronization](https://www.khronos.org/opengl/wiki/Category:Core_API_Ref_Synchronization)：同步对象及其他非对象同步功能的函数文档
