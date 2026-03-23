# SPIR-V

SPIR-V (Standard, Portable Intermediate Representation - V) 是一种用于定义着色器的中间语言。它旨在作为多种不同语言的编译器目标，允许用户以任何方式编写着色语言，同时使实现不必处理像 GLSL 这样复杂语言的解析。

[SPIR-V 注册表](https://www.khronos.org/registry/spir-v/) 包含当前的 SPIR-V 规范及其扩展。

## 着色器编译

SPIR-V 的编译模型类似于 GLSL，但有一些独特特性。

与 GLSL 一样，SPIR-V 使用着色器和程序对象。由于 SPIR-V 是二进制格式，SPIR-V 着色器通过着色器二进制 API 加载：

```cpp
void glShaderBinary(GLsizei count, const GLuint *shaders, GLenum binaryFormat, 
                    const void *binary, GLsizei length);
```

- `shaders` 是已创建的着色器对象数组
- `binaryFormat` 为 `GL_SHADER_BINARY_FORMAT_SPIR_V`
- `binary` 是 SPIR-V 二进制数据，必须包含完整的 SPIR-V（包括头信息）

加载 SPIR-V 二进制后，可以通过以下方式验证：

```cpp
GLboolean isSpirv;
glGetShaderiv(shader, GL_SPIR_V_BINARY, &isSpirv);  // 返回 GL_TRUE
```

### 入口点和特化

SPIR-V 与 GLSL 的两个主要区别：

1. 单个 SPIR-V 文件可以有多个着色器阶段的函数入口点
2. SPIR-V 有"特化常量"的概念：用户可以在 SPIR-V 编译成最终形式之前提供的参数

使用前必须指定入口点并提供特化常量的值：

```cpp
void glSpecializeShader(GLuint shader, const GLchar *pEntryPoint, 
                        GLuint numSpecializationConstants, 
                        const GLuint *pConstantIndex, const GLuint *pConstantValue);
```

- `pEntryPoint` - 入口点的字符串名称
- `pConstantIndex` - 特化常量索引数组
- `pConstantValue` - 对应的值数组

特化 SPIR-V 着色器类似于编译 GLSL 着色器。成功完成后，着色器对象的编译状态为 `GL_TRUE`。

::: warning
- 入口点的"执行模型"（SPIR-V 术语中的"着色器阶段"）必须与创建着色器对象时的阶段匹配
- 如果 `pConstantIndex` 引用了 SPIR-V 二进制未使用的特化常量索引，特化将失败
- 一旦特化，SPIR-V 着色器无法重新特化（但可以重新加载 SPIR-V 二进制数据）
:::

### 链接 SPIR-V

已特化的 SPIR-V 着色器对象可用于链接程序。链接时，要么所有着色器对象都是 SPIR-V 着色器，要么都不是。不能在程序中混合链接 SPIR-V 和非 SPIR-V 着色器。

::: tip
SPIR-V 着色器必须有入口点，因此同一阶段的 SPIR-V 模块无法链接在一起。每个 SPIR-V 着色器对象必须提供其模块的所有代码。
:::

可以在同一管线对象中使用 SPIR-V 着色器构建的分离程序和非 SPIR-V 着色器。

## 映射到 GLSL

OpenGL 规范仍然将 GLSL 视为主要的 OpenGL 着色语言。SPIR-V 有许多概念映射到 GLSL 概念。

### 内省

GLSL 提供了全面的 API 来查询链接程序中的资源接口。这些 API 对 SPIR-V 构建的程序也是合法的，但有一个限制。

由于 SPIR-V 是中间语言，名称不是必需的。因此，任何涉及 SPIR-V 变量或其他构造名称的 OpenGL 内省查询可能不会产生合理结果：
- 查询名称可能返回空字符串或 SPIR-V 中分配的名称（取决于实现）
- 按名称查询资源属性将返回 -1 或 `GL_INVALID_INDEX`

其他形式的内省完全有效。例如，可以查询默认块 uniform 的数量，然后遍历每个 uniform，可靠地获取类型、位置等信息。

### 接口匹配

用户定义变量的输入/输出接口匹配通过显式 `Location` 进行。因此，所有用于输入/输出接口的变量必须分配位置。即使是块成员（通过结构体）也必须分配位置。

输出变量和对应的输入变量必须具有相同的 `Location` 和 `Component` 值。

::: tip
如果输出变量类型是内置标量或向量类型，输入类型不必完全匹配。输出必须与输入具有相同的基本类型，并且必须至少提供输入接收的分量数量。
:::

对于内置接口变量：
- 在 SPIR-V 中，只能有一个内置输入块和一个内置输出块
- 每个块的所有成员必须用 `BuiltIn` 装饰
- 块不能有 `Location` 装饰的成员
- 块的顶级成员必须是内置类型

内置块之间的接口匹配需要精确匹配，但片段着色器输入块例外。

### 变换反馈

任何将输出反馈信息的着色器阶段入口点必须显式使用 `Xfb` 执行模式。

### 着色器子程序

SPIR-V 完全不支持子程序，因此不能使用它们。

### 兼容性特性

SPIR-V 不支持 GLSL 的许多兼容性特性或旧特性：
- 内置 uniform `gl_DepthRangeParameters` 不是 SPIR-V 的一部分
- 缓冲区支持的接口块不支持 `shared` 和 `packed` 布局
- 不支持旧函数如 `texture2D`

## SPIR-V 扩展

SPIR-V 是可扩展的。使用 OpenGL 的所有功能需要一些 SPIR-V 扩展。

## 完整示例

通过 SPIR-V 编译/链接顶点和片段着色器：

```cpp
std::vector<unsigned char> vertexSpirv = // 获取顶点着色器 SPIR-V
std::vector<unsigned char> fragmentSpirv = // 获取片段着色器 SPIR-V

GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
glShaderBinary(1, &vertexShader, GL_SHADER_BINARY_FORMAT_SPIR_V, 
               vertexSpirv.data(), vertexSpirv.size());

std::string vsEntrypoint = ...; // 获取 VS 入口点名称
glSpecializeShader(vertexShader, (const GLchar*)vsEntrypoint.c_str(), 0, nullptr, nullptr);

GLint isCompiled = 0;
glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &isCompiled);
if (isCompiled == GL_FALSE) {
    GLint maxLength = 0;
    glGetShaderiv(vertexShader, GL_INFO_LOG_LENGTH, &maxLength);
    std::vector<GLchar> infoLog(maxLength);
    glGetShaderInfoLog(vertexShader, maxLength, &maxLength, &infoLog[0]);
    glDeleteShader(vertexShader);
    return;
}

GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
glShaderBinary(1, &fragmentShader, GL_SHADER_BINARY_FORMAT_SPIR_V, 
               fragmentSpirv.data(), fragmentSpirv.size());

std::string fsEntrypoint = ...; // 获取 FS 入口点名称
glSpecializeShader(fragmentShader, (const GLchar*)fsEntrypoint.c_str(), 0, nullptr, nullptr);

glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &isCompiled);
if (isCompiled == GL_FALSE) {
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
if (isLinked == GL_FALSE) {
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
