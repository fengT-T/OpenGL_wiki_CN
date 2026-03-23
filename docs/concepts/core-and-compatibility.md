# 核心与兼容性上下文

OpenGL 上下文（Context）代表了一个 OpenGL 实例的所有状态。它包含了默认帧缓冲（Default Framebuffer），即不使用帧缓冲对象时渲染命令绘制目标的位置。可以将上下文理解为承载 OpenGL 的容器——当上下文被销毁时，OpenGL 也就随之销毁。

## 上下文类型演变

在 OpenGL 3.0 之前，所有版本都完全向后兼容。针对 OpenGL 1.1 编写的代码可以在 OpenGL 2.1 实现上正常运行。

OpenGL 3.0 引入了**弃用（Deprecation）**概念，许多函数被标记为弃用，意味着用户应避免使用，因为它们可能在后续版本中被移除。OpenGL 3.1 移除了几乎所有在 3.0 中弃用的功能，包括固定功能管线（Fixed Function Pipeline）。

然而，许多实现仍然支持这些弃用和移除的功能。经过多次尝试后，最终形成了 **核心（Core）** 和 **兼容性（Compatibility）** 两种上下文类型的划分。

### OpenGL 3.1 与 ARB_compatibility

OpenGL 3.1 发布时引入了 `ARB_compatibility` 扩展。该扩展的存在表示弃用或移除的功能仍可通过原有的入口点和枚举使用。这类实现的行为由一个更大规模的 OpenGL 规范定义，因此存在向后兼容规范和非向后兼容规范两种。

### OpenGL 3.2 与配置文件（Profiles）

OpenGL 3.0 引入了新的上下文创建机制，允许用户请求特定版本的 OpenGL。

`ARB_compatibility` 扩展存在一个问题：实现自行决定是否定义它，用户无法请求禁用。这导致核心规范必须是兼容性规范的真子集。

OpenGL 3.2 对此进行了改进，正式将 OpenGL 分为两个配置文件：

- **核心配置文件（Core Profile）**：实现必须支持
- **兼容性配置文件（Compatibility Profile）**：不保证可用，但大多数实现都支持

::: warning 平台差异 - macOS
macOS 10.7 引入 OpenGL 3.2+ 支持时，仅提供核心配置文件。用户只能选择：3.2 或更高版本的核心配置文件，或 2.1 版本。无法在访问 2.1 以后功能的同时使用固定功能管线。
:::

## 前向兼容（Forward Compatibility）

版本 3.0 及以上的上下文可以设置"前向兼容"标志位。这将移除当前配置文件中所有标记为"弃用"的功能。

| 版本 | 效果 |
|------|------|
| 3.0 | 所有弃用功能不可用，模拟 3.1 体验 |
| 3.1 | 移除剩余弃用功能（如宽线） |
| 3.2+ 兼容性 | 无效果（兼容性配置文件无弃用功能） |
| 3.2+ 核心 | 移除剩余弃用功能 |

::: tip 建议
仅在需要 macOS 兼容时使用前向兼容标志位，因为 macOS 创建核心配置文件上下文时要求设置此标志。
:::

## 调试上下文（Debug Contexts）

上下文可以在调试模式下创建，这使得调试输出功能更加有效。

## 无错误上下文（No Error Contexts）

| 属性 | 值 |
|------|-----|
| 核心版本 | 4.6 |
| 扩展 | `KHR_no_error` |

如果设置了 `GL_CONTEXT_FLAG_NO_ERROR_BIT` 标志，上下文将不报告大多数错误。

::: warning 注意
- 仅报告 `GL_OUT_OF_MEMORY_ERROR`，且可能延迟
- 实现不会检查错误，错误参数将导致未定义行为，可能包括程序终止
- 无错误上下文不能与调试或健壮访问上下文同时使用
:::

## 健壮访问上下文（Robust Access Context）

通常，超出绑定存储范围的缓冲区内存访问操作会产生未定义结果（可能导致程序终止）。如果程序未崩溃，还可能读取到其他应用程序写入的值，存在安全隐患。

健壮访问模式确保：
- 越界读取返回明确定义的结果（通常为零）
- 此类访问不会导致程序终止
- 提供更好的进程隔离

## 配置文件检测

使用以下查询检测当前上下文支持的配置文件：

```c
glGetIntegerv(GL_CONTEXT_PROFILE_MASK, *);
```

返回值可包含 `GL_CONTEXT_CORE_PROFILE_BIT` 或 `GL_CONTEXT_COMPATIBILITY_PROFILE_BIT`，但不能同时包含两者。

## 上下文标志

```c
glGetIntegerv(GL_CONTEXT_FLAGS, *);
```

可用的上下文标志：

| 标志 | 说明 |
|------|------|
| `GL_CONTEXT_FLAG_FORWARD_COMPATIBLE_BIT` | 前向兼容上下文 |
| `GL_CONTEXT_FLAG_DEBUG_BIT` | 调试上下文 |
| `GL_CONTEXT_FLAG_ROBUST_ACCESS_BIT` | 支持健壮内存访问 |
| `GL_CONTEXT_FLAG_NO_ERROR_BIT` | 不报告 OpenGL 错误 |
