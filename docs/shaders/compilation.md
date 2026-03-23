# 着色器编译 (Shader Compilation)

着色器编译是将 OpenGL 着色语言 (GLSL) 脚本加载到 OpenGL 中作为着色器使用的过程。OpenGL 提供了三种方式将着色器文本编译为可用的 OpenGL 对象，所有这些编译形式都会生成一个程序对象 (Program Object)。

::: info
本文包含 OpenGL 4.x 特性的引用，如曲面细分着色器 (Tessellation Shader) 和计算着色器 (Compute Shader)。如果您使用 OpenGL 3.x，可以忽略这些引用。
:::

## 着色器对象与程序对象

程序对象可以包含所有着色器阶段的可执行代码，渲染时只需绑定一个程序对象即可。构建包含多个着色器阶段的程序需要一个两阶段的编译过程。

这个过程类似于 C/C++ 源代码的标准编译/链接设置：C/C++ 文本首先通过编译器生成目标文件，然后将一个或多个目标文件链接在一起生成可执行代码。

在 OpenGL 中，着色器文本首先编译生成着色器对象 (Shader Object)，然后将一个或多个着色器对象链接在一起生成可执行的程序对象。

### 着色器对象编译

第一步是为每个要使用的着色器创建着色器对象并编译它们：

```cpp
GLuint glCreateShader(GLenum shaderType);
```

此函数为指定的着色器阶段创建一个空的着色器对象。`shaderType` 必须是以下之一：
- `GL_VERTEX_SHADER` - 顶点着色器
- `GL_TESS_CONTROL_SHADER` - 曲面细分控制着色器 (需要 GL 4.0)
- `GL_TESS_EVALUATION_SHADER` - 曲面细分求值着色器 (需要 GL 4.0)
- `GL_GEOMETRY_SHADER` - 几何着色器
- `GL_FRAGMENT_SHADER` - 片段着色器
- `GL_COMPUTE_SHADER` - 计算着色器 (需要 GL 4.3)

创建着色器对象后，需要为其提供 GLSL 源代码：

```cpp
void glShaderSource(GLuint shader, GLsizei count, const GLchar **string, const GLint *length);
```

`string` 是字符串数组，`count` 是字符串数量。OpenGL 会将这些字符串连接起来编译。`length` 可以是 NULL（假设字符串以 NULL 结尾）或包含每个字符串长度的数组。

设置源代码后，编译着色器：

```cpp
void glCompileShader(GLuint shader);
```

### 着色器错误处理

编译可能成功也可能失败。着色器编译失败不是 OpenGL 错误，需要专门检查：

```cpp
GLint success = 0;
glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
```

如果 `success` 为 `GL_FALSE`，则编译失败。可以通过日志获取详细信息：

```cpp
GLint logSize = 0;
glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &logSize);
std::vector<GLchar> errorLog(logSize);
glGetShaderInfoLog(shader, logSize, &logSize, &errorLog[0]);
```

完整示例：

```cpp
GLuint shader = glCreateShader(...);
glShaderSource(shader, ...);
glCompileShader(shader);

GLint isCompiled = 0;
glGetShaderiv(shader, GL_COMPILE_STATUS, &isCompiled);
if(isCompiled == GL_FALSE) {
    GLint maxLength = 0;
    glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &maxLength);
    std::vector<GLchar> errorLog(maxLength);
    glGetShaderInfoLog(shader, maxLength, &maxLength, &errorLog[0]);
    glDeleteShader(shader);
    return;
}
```

### 程序设置

成功编译着色器对象后，可以将它们链接到程序中：

```cpp
GLuint glCreateProgram();
```

然后将要链接的着色器对象附加到程序：

```cpp
void glAttachShader(GLuint program, GLuint shader);
```

::: tip
可以将同一着色器阶段的多个着色器对象附加到一个程序。链接时，所有代码将被组合。但是，这些着色器对象中只能有一个 `main` 函数。这类似于 C/C++ 中链接多个目标文件。
:::

::: warning
虽然这种功能可用，但最好不要使用。大多数 OpenGL 应用程序不这样做，因此这部分的驱动程序测试不如其他 OpenGL API 部分那么充分，可能会遇到更多驱动程序错误。建议每个着色器阶段使用一个着色器对象。
:::

### 链接前的设置

在链接之前可以设置一些参数，包括：
- 顶点着色器输入属性位置
- 片段着色器输出颜色编号
- 变换反馈输出捕获
- 程序分离

链接后无法更改这些值。

### 程序链接

链接可能因多种原因失败：
- 两个着色器阶段之间的接口匹配无效
- 违反各种着色器阶段限制
- 不同着色器阶段中某些类型的全局定义同名但定义不同
- 引用了声明但未定义的函数

程序链接失败可以通过类似编译失败的方式检测和处理。

### 链接与变量

不同着色器阶段的着色器对象通常不交互，但某些定义被视为在着色器阶段之间共享：
- uniform 变量
- buffer 变量
- 缓冲区支持的接口块

如果一个阶段定义了这些对象，另一个阶段可以定义同名的相同对象，那么内省 API 只会看到一个 uniform/buffer 变量/接口块。这使得同一程序中的着色器阶段可以共享 uniform 变量。

定义必须完全相同，包括成员顺序、数据结构、数组数量等所有内容。

### 清理

链接后（无论成功与否），建议从程序中分离所有着色器对象：

```cpp
void glDetachShader(GLuint program, GLuint shader);
```

如果不打算在其他程序的链接中使用此着色器对象，可以删除它：

```cpp
void glDeleteShader(GLuint shader);
```

### 完整示例

顶点着色器和片段着色器的完整编译/链接示例：

```cpp
std::string vertexSource = // 获取顶点着色器源代码
std::string fragmentSource = // 获取片段着色器源代码

GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
const GLchar *source = (const GLchar *)vertexSource.c_str();
glShaderSource(vertexShader, 1, &source, 0);
glCompileShader(vertexShader);

GLint isCompiled = 0;
glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &isCompiled);
if(isCompiled == GL_FALSE) {
    GLint maxLength = 0;
    glGetShaderiv(vertexShader, GL_INFO_LOG_LENGTH, &maxLength);
    std::vector<GLchar> infoLog(maxLength);
    glGetShaderInfoLog(vertexShader, maxLength, &maxLength, &infoLog[0]);
    glDeleteShader(vertexShader);
    return;
}

GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
source = (const GLchar *)fragmentSource.c_str();
glShaderSource(fragmentShader, 1, &source, 0);
glCompileShader(fragmentShader);

glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &isCompiled);
if(isCompiled == GL_FALSE) {
    GLint maxLength = 0;
    glGetShaderiv(fragmentShader, GL_INFO_LOG_LENGTH, &maxLength);
    std::vector<GLchar> infoLog(maxLength);
    glGetShaderInfoLog(fragmentShader, maxLength, &maxLength, &infoLog[0]);
    glDeleteShader(fragmentShader);
    glDeleteShader(vertexShader);
    return;
}

GLuint program = glCreateProgram();
glAttachShader(program, vertexShader);
glAttachShader(program, fragmentShader);
glLinkProgram(program);

GLint isLinked = 0;
glGetProgramiv(program, GL_LINK_STATUS, (int *)&isLinked);
if(isLinked == GL_FALSE) {
    GLint maxLength = 0;
    glGetProgramiv(program, GL_INFO_LOG_LENGTH, &maxLength);
    std::vector<GLchar> infoLog(maxLength);
    glGetProgramInfoLog(program, maxLength, &maxLength, &infoLog[0]);
    glDeleteProgram(program);
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
    return;
}

glDetachShader(program, vertexShader);
glDetachShader(program, fragmentShader);
```

## 分离程序 (Separate Programs)

程序对象可以包含多个着色器阶段的代码。`glUseProgram` 只接受一个程序，因此渲染时只能使用一个程序。但是，有一种方法可以在链接后动态混合和匹配不同着色器阶段的代码。

要使用分离程序，必须在链接前设置程序参数：

```cpp
glProgramParameteri(program, GL_PROGRAM_SEPARABLE, GL_TRUE);
```

还有一种简化的方法创建分离程序：

```cpp
GLuint glCreateShaderProgramv(GLenum type, GLsizei count, const char **strings);
```

此函数等同于创建指定类型的着色器对象，编译，链接为设置了 `GL_PROGRAM_SEPARABLE` 的程序，然后分离并删除着色器对象。

::: warning
使用分离程序时，如果使用 `gl_PerVertex` 接口块中的任何变量，着色器**必须**重新声明该接口块。
:::

### 程序管线 (Program Pipelines)

使用多个分离程序需要将它们组装成程序管线对象：

```cpp
void glGenProgramPipelines(GLsizei n, GLuint *pipelines);
void glDeleteProgramPipelines(GLsizei n, const GLuint *pipelines);
void glBindProgramPipeline(GLuint pipeline);
```

使用以下函数设置管线中的程序：

```cpp
void glUseProgramStages(GLuint pipeline, GLbitfield stages, GLuint program);
```

`stages` 位域可以是以下组合：
- `GL_VERTEX_SHADER_BIT`
- `GL_TESS_CONTROL_SHADER_BIT`
- `GL_TESS_EVALUATION_SHADER_BIT`
- `GL_GEOMETRY_SHADER_BIT`
- `GL_FRAGMENT_SHADER_BIT`
- `GL_COMPUTE_SHADER_BIT`
- `GL_ALL_SHADER_BITS` (所有上述位的组合)

### 渲染

绑定程序管线后即可渲染：

::: warning
`glUseProgram` 会**覆盖** `glBindProgramPipeline`。如果同时设置了使用的程序和绑定的程序管线，所有渲染将使用通过 `glUseProgram` 设置的程序。确保已调用 `glUseProgram(0)`。
:::

### Uniform 变量与管线

::: tip 建议
建议使用 `glProgramUniform` 直接向程序设置 uniform 变量，而无需绑定或使用程序。这比使用 `glUniform` 配合程序管线更简单。
:::

分离程序示例：

```cpp
GLuint vertProg = glCreateShaderProgramv(GL_VERTEX_SHADER, 1, &vertSrc);
GLuint fragProg = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &fragSrc);

glGenProgramPipelines(1, &pipeline);
glUseProgramStages(pipeline, GL_VERTEX_SHADER_BIT, vertProg);
glUseProgramStages(pipeline, GL_FRAGMENT_SHADER_BIT, fragProg);

GLint colorLoc = glGetUniformLocation(fragProg, "Color");
glProgramUniform4f(fragProg, colorLoc, 1.f, 0.f, 0.f, 1.f);
```

## 二进制上传 (Binary Upload)

编译和链接着色器可能耗时较长。可以缓存链接结果以便更快地重新加载。

首先获取二进制数据长度：

```cpp
glGetProgramiv(program, GL_PROGRAM_BINARY_LENGTH, &length);
```

然后获取二进制数据：

```cpp
void glGetProgramBinary(GLuint program, GLsizei bufsize, GLsizei *length, 
                        GLenum *binaryFormat, void *binary);
```

从二进制数据创建程序：

```cpp
void glProgramBinary(GLuint program, GLenum binaryFormat, const void *binary, GLsizei length);
```

::: warning
程序二进制格式**不**旨在跨设备传输。不同硬件供应商可能不接受相同的二进制格式，甚至同一供应商的不同硬件也可能如此。驱动程序更新也可能更改可接受的二进制格式。使用此功能时，必须有在二进制被拒绝时重新编译着色器的后备方案。
:::

## SPIR-V 编译

SPIR-V 的编译模型类似于 GLSL，但有一些独特特性。SPIR-V 着色器通过着色器二进制 API 加载：

```cpp
void glShaderBinary(GLsizei count, const GLuint *shaders, GLenum binaryFormat, 
                    const void *binary, GLsizei length);
```

SPIR-V 使用特定的 `binaryFormat`：`GL_SHADER_BINARY_FORMAT_SPIR_V`。

在 SPIR-V 着色器对象可以使用之前，必须指定入口点并提供特化常量的值：

```cpp
void glSpecializeShader(GLuint shader, const GLchar *pEntryPoint, 
                        GLuint numSpecializationConstants, 
                        const GLuint *pConstantIndex, const GLuint *pConstantValue);
```

特化 SPIR-V 着色器类似于编译 GLSL 着色器。如果成功，着色器对象的编译状态为 `GL_TRUE`。

## 错误处理

程序链接失败可以通过以下方式检测：

```cpp
GLint isLinked = 0;
glGetProgramiv(program, GL_LINK_STATUS, &isLinked);
```

获取链接日志：

```cpp
GLint maxLength = 0;
glGetProgramiv(program, GL_INFO_LOG_LENGTH, &maxLength);
std::vector<GLchar> infoLog(maxLength);
glGetProgramInfoLog(program, maxLength, &maxLength, &infoLog[0]);
```

## 接口匹配 (Interface Matching)

着色器阶段有输入和输出。大多数着色器输出的值直接馈送到后续着色器阶段的输入变量。

链接多个着色器阶段时，在程序链接时检查这些规则。但是，管线中分离程序之间的接口只能在运行时使用管线时检查。

### 限定符匹配

类型限定符必须在输出变量和输入变量之间匹配，但以下情况除外：
- 存储限定符 (`in/out`) 显然不匹配
- 精度限定符
- `invariant` 限定符
- `precise` 限定符
- GLSL 4.30+ 中插值限定符不需要匹配（由片段着色器指定）

### 分离程序匹配

分离程序允许不完全匹配，但只有使用 `layout(location)` 限定符的松散变量才能在不精确匹配时获得定义的行为。

```glsl
// 输出着色器
layout(location = 5) out vec4 vals;

// 输入着色器
layout(location = 5) in float foo; // 从 vals 获取 .x 分量
```

## 验证 (Validation)

程序对象或程序管线对象必须有效才能用于渲染操作。尽可能在链接时验证有效性，但对于分离程序，只能在运行时验证。

```cpp
void glValidateProgram(GLuint program);
void glValidateProgramPipeline(GLuint pipeline);
```

验证后检查 `GL_VALIDATE_STATUS`。
