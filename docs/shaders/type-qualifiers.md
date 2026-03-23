# 类型限定符 (Type Qualifier)

GLSL 中的**类型限定符 (Type Qualifier)** 用于修改全局和局部变量的存储或行为。这些限定符改变变量的特定方面，如数据来源等。

## 存储限定符

### 默认

未指定存储限定符的全局变量是普通全局变量，作用域为当前着色器阶段。链接到同一程序的同名全局变量引用相同值。

每次着色器调用引用不同的变量实例，调用之间无法通过默认全局变量通信。

### 常量限定符

`const` 限定符表示变量值初始化时的全局变量是普通全局变量。链接到同一程序的同名全局变量共享同一存储。

每个着色器调用引用不同版本的全局变量，无法通过默认限定的全局变量在调用间通信。

### 常量限定符

全局变量、局部变量和函数输入参数可使用 `const` 限定符：

```glsl
const vec3 color = vec3(1.0, 0.0, 0.0);
```

`const` 限定变量初始化后不可修改。由常量表达式初始化的 `const` 变量本身也是常量表达式。

::: tip 版本 4.20+
GLSL 4.20 允许用非常量表达式初始化 `const` 变量，但该变量不会成为常量表达式。
:::

### 着色器阶段输入输出

使用 `in` 限定符声明输入变量，使用 `out` 限定符声明输出变量：

```glsl
in vec3 position;
out vec4 color;
```

- **输入变量**：由前一阶段提供值，着色器内只读
- **输出变量**：传递给下一阶段，着色器必须写入

这些限定符不能用于局部变量。变量可以是非不透明基本类型、数组，但不能是结构体。可聚合到接口块中。

#### 顶点着色器输入

顶点着色器输入称为**顶点属性**，通过顶点数组从缓冲对象传递。每个输入变量有属性位置索引。

#### 细分控制着色器输出

TCS 输出可以是逐顶点或逐片元：
- 逐顶点输出聚合为数组，数组长度为片元的输出顶点数
- 逐片元输出使用 `patch` 关键字声明

每个 TCS 调用只能写入 `gl_InvocationID` 对应的逐顶点输出索引。

#### 细分评估着色器输入

类似 TCS 输出，分为逐顶点和逐片元。

#### 几何着色器输入

几何着色器输入聚合为数组，每个数组元素代表图元的一个顶点。数组长度取决于输入图元类型。

#### 片段着色器输出

片段着色器输出不能是矩阵或布尔类型，必须是单精度浮点或整数类型的标量或向量。

每个输出索引对应 `glDrawBuffers` 设置的绘制缓冲区。

### 插值限定符

插值限定符控制光栅化过程中的值插值方式：

| 限定符 | 说明 |
|-------|-----|
| `flat` | 不插值，使用激发顶点的值 |
| `noperspective` | 窗口空间线性插值 |
| `smooth` | 透视校正插值（默认） |

`centroid` 和 `sample` 限定符影响多重采样时的插值位置：

```glsl
centroid in vec2 texCoord;
sample out vec4 color;
```

::: warning centroid 使用场景
当插值可能导致值超出图元范围（如对负数开平方），使用 `centroid` 确保插值点在图元内部。
:::

### Uniform

使用 `uniform` 限定符声明的变量在渲染调用期间不变：

```glsl
uniform mat4 modelViewProjection;
uniform vec3 lightPosition;
```

Uniform 变量由 OpenGL API 设置，在着色器内隐式常量（但不是编译时常量）。

### Buffer

::: info 版本要求
核心版本：4.3 | 扩展：`ARB_shader_storage_buffer_object`
:::

接口块可使用 `buffer` 限定符，存储来自着色器存储缓冲对象 (SSBO)。与 UBO 不同，存储块可写入，且可包含大小未定的数组。

```glsl
buffer Data {
    vec4 values[];
};
```

### 接口块

输入、输出、uniform 和 buffer 变量可聚合到接口块中：

```glsl
out VertexData {
    vec3 position;
    vec2 texCoord;
} vOut;
```

### Shared

`shared` 限定符声明计算着色器中工作组内共享的变量：

```glsl
shared vec4 sharedData[128];
```

## 布局限定符

详见[布局限定符](./layout-qualifiers.md)。

## 精度限定符

::: warning 兼容性说明
精度限定符仅为与 OpenGL ES 兼容而支持，在桌面 GLSL 中无功能效果。除非需要 ES 兼容，否则不要使用。
:::

三种精度限定符：`highp`、`mediump`、`lowp`。

精度声明语法：

```glsl
precision highp float;
precision mediump int;
```

## 内存限定符

::: info 版本要求
核心版本：4.2 | 扩展：`ARB_shader_image_load_store`
:::

图像变量、着色器存储块及其成员可使用内存限定符：

| 限定符 | 说明 |
|-------|-----|
| `coherent` | 强制内存访问一致性，用于着色器调用间通信 |
| `volatile` | 假设存储内容可能随时改变 |
| `restrict` | 承诺该变量是唯一能修改此内存的变量，允许优化 |
| `readonly` | 只读访问 |
| `writeonly` | 只写访问 |

```glsl
coherent readonly layout(rgba32f) image2D img;
```

::: tip
`readonly` 和 `writeonly` 可以同时使用，此时仍可查询资源信息（如图像尺寸）。
:::

## 不变性限定符

`invariant` 限定符确保不同程序计算相同的输出值：

```glsl
invariant gl_Position;
invariant out vec3 Color;
```

或应用于现有声明：

```glsl
out vec3 Color;
invariant Color;
```

::: info
输入变量的 `invariant` 限定符仅为对称性而允许，无实际意义。`invariant` 不参与接口匹配。
:::

## 精确限定符

::: info 版本要求
核心版本：4.0 | 扩展：`ARB_gpu_shader5`
:::

`precise` 限定符确保着色器计算严格按源代码指定的顺序执行，避免优化引起的不变性问题：

```glsl
precise out vec3 position;
```

这对于细分着色器避免裂缝至关重要。`precise` 会阻止使用融合乘加指令实现 `a * b + c` 形式的表达式。

## 限定符顺序

在 OpenGL 4.2 或 `ARB_shading_language_420pack` 之前，限定符必须按特定顺序：

```
invariant-qualifier interpolation-qualifier layout-qualifier storage-qualifier precision-qualifier
```

`centroid` 必须紧邻 `in` 或 `out`。

OpenGL 4.2+ 移除了大多数顺序限制，但 `centroid` 仍需紧邻 `in`/`out`。允许多个布局限定符，但大多数其他限定符组只能使用一个。

## 内置变量重声明

可以重新声明内置变量以使用不同的限定符，但类型必须相同：

```glsl
flat out vec4 gl_VaryingColor;
```

某些变量不能使用特定限定符，如 `gl_Position` 不能使用插值限定符。

## 已移除的限定符

以下限定符在 GLSL 1.30 中弃用，1.40 起移除：

- `attribute`：等效于顶点着色器的 `in`
- `varying`：等效于片段着色器的 `in` 或顶点着色器的 `out`
