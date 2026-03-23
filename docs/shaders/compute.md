# 计算着色器 (Compute Shader)

计算着色器（Compute Shader）是专门用于计算任意信息的着色器阶段。虽然它可以用于渲染，但通常用于与绘制三角形和像素无直接关联的任务。

::: info 版本信息
- 核心版本：4.6
- 引入版本：4.3
- ARB 扩展：`ARB_compute_shader`
:::

## 执行模型

计算着色器的执行方式与其他着色器阶段不同。其他着色器阶段有明确定义的输入值集，执行频率由阶段性质决定（如顶点着色器每个输入顶点执行一次）。

计算着色器的执行"空间"很大程度上是抽象的，由着色器本身决定。计算着色器没有用户定义的输入和输出，内置输入仅定义特定调用在执行"空间"中的位置。

如果计算着色器需要输入数据，必须通过纹理访问、任意图像加载、着色器存储块等方式自行获取。输出时也必须显式写入图像或着色器存储块。

### 计算空间 (Compute Space)

计算着色器操作的核心概念是**工作组（Work Group）**，这是用户可以执行的最小计算操作单位。

工作组空间是三维的，具有 X、Y、Z 三个维度。任何维度都可以为 1，实现一维或二维计算。

::: warning 执行顺序
工作组可以以任意顺序执行。例如，给定工作组集合 (3, 1, 2)，可能先执行组 (0, 0, 0)，然后跳到 (1, 0, 1)，再到 (2, 0, 0) 等。计算着色器不应依赖工作组的处理顺序。
:::

每个工作组内可以有多次计算着色器调用，这个数量由计算着色器自身定义，称为**本地大小（Local Size）**。

因此，如果计算着色器的本地大小为 (128, 1, 1)，工作组数量为 (16, 8, 64)，则总共会产生 1,048,576 次独立的着色器调用。

工作组内的调用可以"并行"执行，并通过 `shared` 变量和特殊函数进行通信。不同工作组之间的调用无法有效通信（否则可能导致系统死锁）。

## 分发 (Dispatch)

计算着色器不属于常规渲染管线，执行绘图命令时不会调用计算着色器。

### 分发函数

```c
void glDispatchCompute(GLuint num_groups_x, GLuint num_groups_y, GLuint num_groups_z);
```

`num_groups_*` 参数定义三维工作组数量，这些值不能为零。

### 间接分发

```c
void glDispatchComputeIndirect(GLintptr indirect);
```

`indirect` 参数是当前绑定到 `GL_DISPATCH_INDIRECT_BUFFER` 目标的缓冲区的字节偏移量。

::: warning 警告
间接分发绕过了 OpenGL 的常规错误检查。使用越界的工作组大小可能导致程序崩溃甚至 GPU 锁死。
:::

## 输入

计算着色器不能有用户定义的输入变量。如需提供输入，必须使用存储缓冲区或纹理等资源。

### 内置输入变量

```glsl
in uvec3 gl_NumWorkGroups;
in uvec3 gl_WorkGroupID;
in uvec3 gl_LocalInvocationID;
in uvec3 gl_GlobalInvocationID;
in uint  gl_LocalInvocationIndex;
```

| 变量 | 说明 |
|------|------|
| `gl_NumWorkGroups` | 分发函数传入的工作组数量 |
| `gl_WorkGroupID` | 当前着色器调用的工作组 ID，各分量范围为 [0, gl_NumWorkGroups.XYZ) |
| `gl_LocalInvocationID` | 工作组内的调用 ID，各分量范围为 [0, gl_WorkGroupSize.XYZ) |
| `gl_GlobalInvocationID` | 唯一标识当前调用的 ID，等价于 `gl_WorkGroupID * gl_WorkGroupSize + gl_LocalInvocationID` |
| `gl_LocalInvocationIndex` | 一维版本的 `gl_LocalInvocationID` |

### 本地大小 (Local Size)

本地大小在着色器中定义：

```glsl
layout(local_size_x = X, local_size_y = Y, local_size_z = Z) in;
```

默认本地大小为 1，可以只指定需要的维度。

本地大小作为编译时常量可用：

```glsl
const uvec3 gl_WorkGroupSize;
```

## 输出

计算着色器没有输出变量。如需输出数据，必须使用着色器存储缓冲区或图像加载存储操作。

## 共享变量 (Shared Variables)

计算着色器中的全局变量可以使用 `shared` 存储限定符声明。这些变量的值在工作组内的所有调用之间共享。

```glsl
shared uint foo;  // 不能有初始化器
```

工作组开始时，共享变量的值是未初始化的。

### 共享内存一致性

共享变量访问使用非一致内存访问规则。共享变量隐式声明为 `coherent`。

可用的内存屏障：

- `memoryBarrierShared()`：专门用于共享变量排序
- `groupMemoryBarrier()`：仅对当前工作组内的读写进行排序

要同步工作组内调用之间的读写，必须使用 `barrier()` 函数：

```glsl
barrier();  // 所有调用必须到达此点后才能继续
```

::: warning 限制
`barrier()` 只能从统一流控制（uniform flow control）中调用。所有调用必须以相同顺序调用相同的 `barrier()` 序列。
:::

### 原子操作

可以对整型共享变量执行原子操作：

```glsl
nint atomicAdd(inout nint mem, nint data);
nint atomicMin(inout nint mem, nint data);
nint atomicMax(inout nint mem, nint data);
nint atomicAnd(inout nint mem, nint data);
nint atomicOr(inout nint mem, nint data);
nint atomicXor(inout nint mem, nint data);
nint atomicExchange(inout nint mem, nint data);
nint atomicCompSwap(inout nint mem, nint compare, nint data);
```

::: tip 返回值
所有原子函数返回**原始值**（操作前的值）。`nint` 可以是 `int` 或 `uint`。
:::

## 限制

### 工作组数量限制

通过 `glGetIntegeri_v` 查询 `GL_MAX_COMPUTE_WORK_GROUP_COUNT`（各轴最小值为 65535）。

### 本地大小限制

- 各维度限制：`GL_MAX_COMPUTE_WORK_GROUP_SIZE`（X/Y 最小 1024，Z 最小 64）
- 总调用数限制：`GL_MAX_COMPUTE_WORK_GROUP_INVOCATIONS`（最小 1024）

### 共享内存限制

`GL_MAX_COMPUTE_SHARED_MEMORY_SIZE` 定义共享变量总存储大小（最小 32KB）。
