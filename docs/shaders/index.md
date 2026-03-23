# Shader 着色器

**Shader（着色器）** 是用户定义的程序，运行在图形处理器的特定阶段。着色器为渲染管线（Rendering Pipeline）的某些可编程阶段提供代码，也可用于GPU上的通用计算。

## Stages 着色器阶段

渲染管线定义了若干可编程阶段，每个阶段代表特定类型的处理过程，拥有各自的输入和输出。

着色器使用 **OpenGL Shading Language (GLSL)** 编写。OpenGL 定义了以下着色器阶段：

| 阶段 | 枚举值 | 版本要求 |
|------|--------|----------|
| Vertex Shader（顶点着色器） | `GL_VERTEX_SHADER` | - |
| Tessellation Control（细分控制着色器） | `GL_TESS_CONTROL_SHADER` | GL 4.0 或 ARB_tessellation_shader |
| Tessellation Evaluation（细分管着色器） | `GL_TESS_EVALUATION_SHADER` | GL 4.0 或 ARB_tessellation_shader |
| Geometry Shader（几何着色器） | `GL_GEOMETRY_SHADER` | - |
| Fragment Shader（片段着色器） | `GL_FRAGMENT_SHADER` | - |
| Compute Shader（计算着色器） | `GL_COMPUTE_SHADER` | GL 4.3 或 ARB_compute_shader |

::: tip 程序对象
**Program Object（程序对象）** 可以将多个着色器阶段组合成一个完整的链接单元。**Program Pipeline Object（程序管线对象）** 则可以将包含单个着色器阶段的程序组合成完整的管线。
:::

## Execution and Invocations 执行与调用

当执行绑定的 Program Object 或 Program Pipeline Object 时，渲染管线的可编程部分将执行存储在当前程序中的着色器代码。

每个着色器阶段根据渲染内容执行一次或多次，每次执行称为一次 **invocation（调用）**。除少数例外，着色器调用之间不能相互交互。

### 各阶段调用频率

- **Vertex Shader**：大约每个输入顶点调用一次。使用索引绘制时，由于 Post Transform Cache，可能少于每个顶点一次。
- **Tessellation Control Shader**：精确地为每个 patch 的每个输出顶点调用一次。同一 patch 的调用可以通过输出变量相互通信。
- **Tessellation Evaluation Shader**：大约为细分后抽象 patch 的每个顶点调用一次。
- **Geometry Shader**：每个到达该阶段的图元调用一次。支持实例化以多次调用。
- **Fragment Shader**：为光栅化生成的每个 Fragment（片段）调用一次。可能存在辅助调用用于计算隐式导数。
- **Compute Shader**：调用次数由工作组数量乘以局部大小决定。同一工作组内的调用可以有限地相互通信。

## Execution Model and Divergence 执行模型与分歧

GPU 采用 **SIMD（单指令多数据）** 架构，多个着色器调用被捆绑在一起在同一 SIMD 核心上执行。

::: warning 分支分歧
当条件分支导致不同调用执行不同路径时，会发生 **divergence（分歧）**，命令处理器必须串行执行不同路径，影响性能。
:::

### 静态统一表达式

编译器可以确定不会产生分歧的条件分支，如果分支表达式仅来自：
- 常量
- `uniform` 值
- 其他仅来自常量和 uniform 的表达式

这称为 **statically uniform expression（静态统一表达式）**。

```glsl
// 安全：循环范围由 uniform 定义
for (int i = 0; i < uniformCount; i++) {
    // 不会产生分歧
}
```

::: tip 编译器优化
现代编译器会尝试避免真正的执行分歧。对于简单的三元表达式 `? :` 或小型 `if` 语句，编译器通常会同时计算两个分支，然后根据条件选择结果。
:::

## Resource Limitations 资源限制

着色器可以访问多种资源：纹理、uniform 变量、uniform 块、图像变量、原子计数器、shader storage 缓冲区等。每种资源都有可查询的最大数量限制。

### 单阶段资源限制

以下枚举值中的 `*` 代表阶段名：`VERTEX`、`TESS_CONTROL`、`TESS_EVALUATION`、`COMPUTE`、`GEOMETRY` 或 `FRAGMENT`。

| 枚举值 | 说明 | 最小值 |
|--------|------|--------|
| `GL_MAX_*_UNIFORM_COMPONENTS` | uniform 变量的活跃组件数 | 1024 |
| `GL_MAX_*_UNIFORM_BLOCKS` | 可访问的 uniform 块数量 | 12 (GL 3.3), 14 (GL 4.3) |
| `GL_MAX_*_INPUT_COMPONENTS` | 该阶段输入组件的最大数量 | 因阶段而异 |
| `GL_MAX_*_OUTPUT_COMPONENTS` | 该阶段输出组件的最大数量 | 因阶段而异 |
| `GL_MAX_*_TEXTURE_IMAGE_UNITS` | 采样器可访问的纹理单元数 | 16 |
| `GL_MAX_*_IMAGE_UNIFORMS` | 图像变量数量 | 8 (Fragment/Compute), 0 (其他) |
| `GL_MAX_*_ATOMIC_COUNTERS` | 原子计数器变量数量 | 8 (Fragment/Compute), 0 (其他) |
| `GL_MAX_*_SHADER_STORAGE_BLOCKS` | shader storage 块数量 | 8 (Fragment/Compute), 0 (其他) |

::: warning 特殊情况
- Vertex Shader 使用 `GL_MAX_VERTEX_ATTRIBUTES` 限制顶点属性
- Fragment Shader 使用 `GL_MAX_DRAW_BUFFERS` 限制绘制缓冲区
- Fragment Shader 的纹理单元限制为 `GL_MAX_TEXTURE_IMAGE_UNITS`（无 FRAGMENT 前缀）
:::

### Aggregate Limits 汇总限制

跨所有着色器阶段的总体限制：

| 枚举值 | 说明 | 最小值 |
|--------|------|--------|
| `GL_MAX_UNIFORM_BUFFER_BINDINGS` | uniform 缓冲区绑定点数量 | 36 (GL 3.3), 72 (GL 4.3) |
| `GL_MAX_COMBINED_UNIFORM_BLOCKS` | 所有活跃程序可用的 uniform 块总数 | 36 (GL 3.3), 70 (GL 4.3) |
| `GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS` | 所有活跃程序可用的纹理单元总数 | 48 (GL 3.3), 96 (GL 4.3) |
| `GL_MAX_IMAGE_UNITS` | 图像单元总数 | 8 |
| `GL_MAX_COMBINED_SHADER_OUTPUT_RESOURCES` | shader storage 块 + 图像变量 + 片段输出的总数 | 8 |