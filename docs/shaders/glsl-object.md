# GLSL 对象

**GLSL 对象（GLSL Object）** 是 OpenGL API 中用于封装已编译或已链接着色器的对象，这些着色器负责执行渲染管线的各个阶段。虽然它们被称为"对象"，但大多数并不遵循标准的 OpenGL 对象模型。

## 程序对象

**程序对象（Program Object）** 代表一个或多个着色器阶段的完整可执行代码。程序对象属于 OpenGL 对象，但不使用标准的 OpenGL 对象模型。

### 创建

创建空的程序对象：

```cpp
GLuint glCreateProgram()
```

程序对象通过 `glDeleteProgram` 删除。空的程序对象需要填充可执行代码，这可以通过以下方式完成：
- 编译并链接着色器到程序中
- 上传预先编译的二进制数据

#### 链接前设置

在执行链接步骤之前，有时需要提供一些影响最终链接结果的设置。这些操作为着色器中的接口元素分配资源编号。较新的 OpenGL 特性允许在着色器代码中直接分配这些资源。

### 内省查询

程序成功链接后，可以查询各种接口的信息，包括：
- 如何设置 Uniform 值
- 程序使用的顶点属性
- 其他类似资源

### 状态设置

除了链接前设置使用的状态外，程序对象还有以下可变状态：
- 所有**活跃 uniform 变量**的当前值
  - 包括声明为全局 uniform 的不透明类型的绑定索引
- Uniform 块的当前绑定索引
- 着色器存储块的当前绑定索引

::: warning
Subroutine Uniform 的当前状态**不属于**任何程序对象的状态。
:::

## 着色器对象

**着色器对象（Shader Object）** 代表单个着色器阶段的已编译 GLSL 代码。代码可能不是该阶段的完整代码，完整代码可以由多个包含相同阶段源代码的着色器对象组装而成。着色器对象不是 OpenGL 对象，但它们是对象。

创建着色器对象：

```cpp
GLuint glCreateShader(GLenum shaderType)
```

`shaderType` 定义着色器对象包含哪个阶段的代码，取值为标准着色器阶段枚举值。

着色器对象存储的状态较少：
- 源代码字符串（通过 `glGetShaderSource` 获取）
- 最近编译是否成功（通过 `glGetShader(GL_COMPILE_STATUS)` 获取）
- 编译失败时的错误信息（通过 `glGetShaderInfoLog` 获取）
- 最近编译产生的 GLSL 目标代码（无法查询，链接时使用）

使用 `glDeleteShader` 删除着色器对象。虽然不是 OpenGL 对象，但如果在删除前将其附加到程序对象，可以被孤立。

## 程序管线对象

**程序管线对象（Program Pipeline Object）** 是用于包含可分离程序对象的 OpenGL 容器对象。当管线处于活动状态时，管线中程序定义的着色器阶段代码将用于各种操作。

程序管线对象遵循标准的 OpenGL 对象约定：

```cpp
void glGenProgramPipelines(GLsizei n, GLuint *pipelines)
void glDeleteProgramPipelines(GLsizei n, const GLuint *pipelines)
void glBindProgramPipeline(GLuint pipeline)
```

::: tip
与大多数 OpenGL 对象不同，创建管线名称时会同时创建对象数据，因此无需绑定即可使用。程序管线对象应仅在渲染或设置 uniform 时绑定。
:::

设置管线中的程序：

```cpp
void glUseProgramStages(GLuint pipeline, GLbitfield stages, GLuint program)
```

`stages` 位域决定从 `program` 获取哪些着色器阶段的代码，可用的位包括：
- `GL_VERTEX_SHADER_BIT`
- `GL_TESS_CONTROL_SHADER_BIT`
- `GL_TESS_EVALUATION_SHADER_BIT`
- `GL_GEOMETRY_SHADER_BIT`
- `GL_FRAGMENT_SHADER_BIT`
- `GL_COMPUTE_SHADER_BIT`

也可以使用 `GL_ALL_SHADER_BITS` 表示所有阶段。如果 `program` 为 0，则清除指定阶段。

程序管线对象是容器对象，不能在多个 OpenGL 上下文之间共享。

### Uniform 与管线

::: warning 强烈建议
使用 `glProgramUniform` 直接设置程序的 uniform，无需绑定或使用程序。本节描述的方法仅用于向后兼容。
:::

`glUniform` 修改当前使用程序的 uniform 状态。当没有通过 `glUseProgram` 绑定程序时，会检查当前绑定的程序管线。管线的活动程序通过以下函数设置：

```cpp
void glActiveShaderProgram(GLuint pipeline, GLuint program)
```

`program` 必须是有效的已链接程序对象，且不能为零。

::: info
`program` 不必附加到 `pipeline`，管线可以有一个完全无关的程序作为其活动程序。
:::

## 程序使用

要使用程序封装的着色器阶段，必须将程序对象绑定到 OpenGL 上下文：

```cpp
void glUseProgram(GLuint program)
```

绑定程序后，所有绘图命令和计算调度操作将使用该程序链接的着色器及其设置的状态。

要使用程序管线：
1. 使用 `glUseProgram(0)` 解绑任何程序
2. 使用 `glBindProgramPipeline` 绑定管线对象

::: warning
如果通过 `glUseProgram` 绑定了程序，任何绑定的程序管线将被忽略。
:::

## 参考

- [Core API Ref Shader Program Creation](https://www.khronos.org/opengl/wiki/Category:Core_API_Ref_Shader_Program_Creation)：创建着色器、程序和程序管线对象的核心 OpenGL 函数参考
- [Core API Ref Shader Program Query](https://www.khronos.org/opengl/wiki/Category:Core_API_Ref_Shader_Program_Query)：查询着色器和程序信息的函数参考
- [Core API Ref Shader Program Usage and State](https://www.khronos.org/opengl/wiki/Category:Core_API_Ref_Shader_Program_Usage_and_State)：设置程序和程序管线对象状态的函数参考
