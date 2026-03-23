# Uniform 变量

**Uniform** 是使用 `uniform` 存储限定符声明的全局着色器变量。这些变量作为用户传递给着色器程序的参数，其值存储在程序对象中。

Uniform 变量之所以称为"uniform"，是因为在特定渲染调用中，它们的值在所有着色器调用间保持不变。这与着色器阶段输入输出形成对比，后者通常在每个调用中不同。

## GLSL 定义与行为

Uniform 变量必须在全局作用域定义，可以是任何类型或类型的聚合：

```glsl
struct TheStruct {
    vec3 first;
    vec4 second;
    mat4x3 third;
};

uniform vec3 oneUniform;
uniform TheStruct aUniformOfArrayType;
uniform mat4 matrixArrayUniform[25];
uniform TheStruct uniformArrayOfStructs[10];
```

Uniform 变量在着色器内隐式常量，尝试修改会导致编译错误。不能作为 `out` 或 `inout` 函数参数传递。

可以初始化默认值：

```glsl
uniform vec3 initialUniform = vec3(1.0, 0.0, 0.0);
```

这将使 uniform 保持该值，直到用户修改。

::: warning 平台问题
某些驱动程序可能未正确实现 uniform 初始化器。
:::

### 显式 Uniform 位置

::: info 版本要求
核心版本：4.3 | 扩展：`ARB_explicit_uniform_location`
:::

接口块外的 uniform 可以直接指定位置：

```glsl
layout(location = 2) uniform mat4 modelToWorldMatrix;
```

`glGetUniformLocation(prog, "modelToWorldMatrix")` 保证返回 2。

**数组与结构体**从给定位置开始顺序分配：

```glsl
layout(location = 2) uniform mat4 some_mats[10];  // 占用位置 2-11

struct Thingy {
    vec4 an_array[3];
    int foo;
};
layout(location = 2) uniform Thingy some_thingies[6];  // 占用 24 个位置
```

::: warning 位置冲突
将相同位置分配给不同名称或类型的 uniform 是非法的，会导致链接错误。

```glsl
layout(location = 2) uniform mat4 some_mats[10];  // 占用 2-11
layout(location = 6) uniform vec4 some_vecs[4];   // 错误：与 some_mats[4] 冲突
```
:::

可用位置数量由 `GL_MAX_UNIFORM_LOCATIONS` 限定（至少 1024）。

## 活跃 Uniform

GLSL 编译器和链接器会尽可能优化。只有影响阶段输出且自身能改变输出的 uniform 才会被保留。

被完全链接程序暴露的 uniform 称为**活跃 uniform**；其他 uniform 是非活跃的，无法使用。

## 实现限制

每个着色器阶段有活跃 uniform 数量限制：

| 阶段 | 查询常量 |
|-----|---------|
| 顶点 | `GL_MAX_VERTEX_UNIFORM_COMPONENTS` |
| 几何 | `GL_MAX_GEOMETRY_UNIFORM_COMPONENTS` |
| 片段 | `GL_MAX_FRAGMENT_UNIFORM_COMPONENTS` |
| 细分控制 | `GL_MAX_TESS_CONTROL_UNIFORM_COMPONENTS` |
| 细分评估 | `GL_MAX_TESS_EVALUATION_UNIFORM_COMPONENTS` |
| 计算 | `GL_MAX_COMPUTE_UNIFORM_COMPONENTS` |

OpenGL 3.0+ 保证至少 1024 个分量。

**分量计算规则**：
- `vec3` 占用 3 个分量
- 矩阵最多占用 `4 * min(rows, cols)` 个分量
- 双精度值占用单精度等效的 2 倍空间

::: tip
实现可能因硬件原因拒绝着色器，即使分量计数在限制内。某些硬件（特别是向量硬件）可能将每个 uniform 视为 4 个分量。
:::

## Uniform 管理

程序对象封装 uniform 状态。同一程序的所有阶段共享相同 uniform 集合。如果顶点和片段着色器定义了同名 uniform，则程序只有一个该 uniform。

::: warning 链接错误
同名但类型不同的 uniform 在不同着色器阶段定义会导致链接错误。
:::

每个活跃 uniform 有一个**位置**——用于快速访问的数字句柄。如果未显式指定位置，OpenGL 将任意分配。不同程序中相同 uniform 可能有不同位置。

### 修改 Uniform 值

使用 `glUniform*` 系列函数修改 uniform 值：

```cpp
void glUniform1f(GLint location, GLfloat v0);
void glUniform3fv(GLint location, GLsizei count, const GLfloat *value);
void glUniformMatrix4fv(GLint location, GLsizei count, GLboolean transpose, const GLfloat *value);
```

必须先绑定程序到上下文：

```cpp
glUseProgram(program);
glUniform3fv(location, 1, value);
```

::: tip 直接状态访问
OpenGL 4.1 或 `ARB_separate_shader_objects` 提供 `glProgramUniform*` 函数，无需绑定程序即可设置 uniform。
:::

## Uniform 块与缓冲

详见 [Uniform 缓冲对象](./uniform-buffer-objects.md)。

将一组 uniform 存储在独立于程序对象的存储中，允许多程序共享数据、快速切换 uniform 集合。

使用接口块声明：

```glsl
uniform MatrixBlock {
    mat4 projection;
    mat4 modelView;
};
```

::: warning
不透明类型（如采样器）不能作为 uniform 块成员。
:::

## 访问 Uniform 信息

通过程序内省 API 查询 uniform 信息：

```cpp
GLint glGetUniformLocation(GLuint program, const GLchar *name);
void glGetActiveUniform(GLuint program, GLuint index, GLsizei bufSize,
                        GLsizei *length, GLint *size, GLenum *type, GLchar *name);
```

数组命名约定允许获取整个数组或单个元素的位置。结构体成员位置可能是非连续的（除非显式指定）。
