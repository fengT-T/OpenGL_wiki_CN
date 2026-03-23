# 布局限定符 (Layout Qualifier)

GLSL 中的许多变量和定义可以关联**布局限定符 (Layout Qualifier)**。这些限定符影响变量的存储来源，以及其他面向用户的属性。

## 基本语法

所有布局限定符使用统一语法定义：

```glsl
layout(qualifier1, qualifier2 = value, ...) variable definition
```

限定符的顺序通常无关紧要。某些限定符可以接受赋值。在 OpenGL 4.4 或 `ARB_enhanced_layouts` 扩展之前，`value` 必须是整数字面量；之后可以是整型常量表达式（编译时常量）。

::: tip
OpenGL 4.2 或 `ARB_shading_language_420pack` 允许一个定义使用多个 `layout()` 段，相同限定符可以多次出现，最后定义的值生效。
:::

## 接口布局

### 顶点着色器属性索引

顶点着色器输入可以指定属性索引：

```glsl
layout(location = attribute_index) in vec3 position;
```

使用此语法后，可以完全省略 `glBindAttribLocation` 调用。如果两者同时使用且发生冲突，布局限定符优先。

占用多个属性槽的属性会从给定索引开始顺序分配。例如：

```glsl
layout(location = 2) in vec3 values[4];
```

这将分配属性索引 2、3、4、5。

### 片段着色器缓冲输出

片段着色器输出可以指定缓冲索引：

```glsl
layout(location = output_index) out vec4 outColor;
```

这允许省略 `glBindFragDataLocation` 调用。

**双源混合 (Dual Source Blending)** 场景下：

```glsl
layout(location = output_index, index = dual_output_index) out vec4 outColor;
```

### 程序分离链接

::: info 版本要求
核心版本：4.1 | 扩展：`ARB_separate_shader_objects`
:::

当使用分离程序时，可以通过索引而非名称匹配输入输出。使用 `location` 限定符实现：

```glsl
// 顶点着色器输出
layout(location = 0) out vec4 color;
layout(location = 1) out vec2 texCoord;
layout(location = 2) out vec3 normal;

// 片段着色器输入 - 可以使用不同的名称和类型
layout(location = 0) in vec4 diffuseAlbedo;
layout(location = 1) in vec2 texCoord;
layout(location = 2) in vec3 cameraSpaceNormal;
```

**位置大小规则**：
- 标量和 `double`/`dvec2` 类型占 1 个位置
- `dvec3` 和 `dvec4` 占 2 个位置
- 结构体根据成员类型按顺序计算
- 数组根据数组大小计算

### 接口组件

::: info 版本要求
核心版本：4.4 | 扩展：`ARB_enhanced_layouts`
:::

使用 `component` 限定符可以回收未使用的空间，在同一位置的不同组件中声明变量：

```glsl
layout(location = 0) out vec2 arr1[5];
layout(location = 0, component = 2) out vec2 arr2[4];
layout(location = 4, component = 2) out float val;
```

**限制条件**：
- 共享同一位置的变量必须具有相同的基础数据类型
- 必须使用相同的插值限定符
- 不能用于矩阵、结构体或接口块本身

## 绑定点

::: info 版本要求
核心版本：4.2 | 扩展：`ARB_shading_language_420pack`
:::

缓冲支持的接口块和不透明类型可以使用 `binding` 限定符：

```glsl
layout(binding = 3) uniform sampler2D mainTexture;
layout(binding = 1, std140) uniform MainBlock {
    vec3 data;
};
```

这相当于获取 uniform 位置后设置其值。

## 图像格式

图像 uniform 变量需要指定格式限定符，定义读写操作的数据格式：

| 浮点格式 | 有符号整数格式 | 无符号整数格式 |
|---------|---------------|---------------|
| `rgba32f`, `rgba16f`, `r32f` | `rgba32i`, `rgba16i`, `r32i` | `rgba32ui`, `rgba16ui`, `r32ui` |
| `rg32f`, `rg16f`, `r16f` | `rg32i`, `rg8i`, `r8i` | `rg32ui`, `rg8ui`, `r8ui` |
| `r11f_g11f_b10f` | `rgba8i` | `rgba8ui`, `rgb10_a2ui` |
| `rgba8`, `rg8`, `r8` | - | - |
| `rgba16_snorm`, `r8_snorm` | - | - |

## 原子计数器存储

::: info 版本要求
核心版本：4.2 | 扩展：`ARB_shader_atomic_counters`
:::

原子计数器变量需要 `binding` 和可选的 `offset` 限定符：

```glsl
layout(binding = 0, offset = 12) uniform atomic_uint one;
layout(binding = 0) uniform atomic_uint two;       // offset = 16
layout(binding = 0, offset = 4) uniform atomic_uint three;
```

未指定 `offset` 时，自动在上一个同 binding 的变量基础上加 4 字节。

## 接口块内存布局

Uniform 块和着色器存储块有多种布局限定符定义变量的打包和排序方式，详见[接口块内存布局](./interface-blocks.md#内存布局)。

## 显式 Uniform 位置

::: info 版本要求
核心版本：4.3 | 扩展：`ARB_explicit_uniform_location`
:::

接口块外的 uniform 可以直接指定位置：

```glsl
layout(location = 2) uniform mat4 modelToWorldMatrix;
```

`glGetUniformLocation(prog, "modelToWorldMatrix")` 将保证返回 2。

数组和结构体从给定位置开始顺序分配位置：

```glsl
layout(location = 2) uniform mat4 some_mats[10];  // 占用位置 2-11
```

::: warning
不能将相同的位置分配给不同名称或类型的 uniform，否则会导致链接错误。
:::

## 子程序限定符

::: info 版本要求
核心版本：4.3 | 扩展：`ARB_explicit_uniform_location`
:::

子程序函数可以指定索引：

```glsl
layout(index = 2) subroutine(SubroutineTypeName, ...) ...;
```

子程序 uniform 变量可以指定位置：

```glsl
layout(location = 1) subroutine uniform SubroutineTypeName subroutineVariableName;
```

## Transform Feedback 限定符

::: info 版本要求
核心版本：4.4 | 扩展：`ARB_enhanced_layouts`
:::

使用布局限定符定义 Transform Feedback 捕获的输出变量：

```glsl
layout(xfb_buffer = 1, xfb_stride = 32) out;

layout(xfb_buffer = 0) out Data {
    layout(xfb_offset = 0) float val1;
    layout(xfb_offset = 4) vec4 val2;
};
```

主要限定符：
- `xfb_offset`：字节偏移量
- `xfb_buffer`：缓冲绑定索引
- `xfb_stride`：缓冲步长

## 着色器阶段选项

### 细分控制着色器输出顶点数

```glsl
layout(vertices = vertex_count) out;
```

### 几何着色器图元

```glsl
layout(primitive_type) in;
layout(primitive_type, max_vertices = integer_value) out;
```

输入图元类型：`points`、`lines`、`lines_adjacency`、`triangles`、`triangles_adjacency`

输出图元类型：`points`、`line_strip`、`triangle_strip`

### 片段着色器坐标原点

重新声明 `gl_FragCoord`：

```glsl
layout(origin_upper_left) in vec4 gl_FragCoord;
layout(pixel_center_integer) in vec4 gl_FragCoord;
```

### 早期片段测试

::: info 版本要求
核心版本：4.2 | 扩展：`ARB_shader_image_load_store`
:::

强制在片段着色器执行前进行深度和模板测试：

```glsl
layout(early_fragment_tests) in;
```

::: warning
使用此限定符后，任何对 `gl_FragDepth` 的写入将被忽略。
:::
