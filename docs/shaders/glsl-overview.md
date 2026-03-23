# OpenGL 着色语言

**OpenGL 着色语言（OpenGL Shading Language，简称 GLSL）** 是 OpenGL 的主要着色语言。通过 OpenGL 扩展可以使用其他着色语言，但 GLSL（以及 SPIR-V）无需扩展即可直接获得 OpenGL 支持。

GLSL 是一种 C 风格语言，经历了多个版本迭代，与 OpenGL 共享弃用模型。当前版本为 4.60。

## 编译模型

GLSL 的编译模型与其他着色语言相比相当独特，更接近标准 C 语言范式。编译过程由多种对象类型管理，这些对象不遵循标准的 OpenGL 对象模型。

### 术语说明

由于 GLSL 独特的编译模型，需要区分以下术语：

- **着色器对象（Shader Object）**：特定可编程阶段的已编译字符串集合，甚至不需要包含该阶段的完整代码
- **程序（Program）**：覆盖多个可编程阶段的完整链接程序

::: info
本文档中提到的"着色器"通常指 GLSL 概念中的"程序"，而"着色器对象"特指 GLSL 的 shader object。
:::

## 语言特性

GLSL 在许多方面与 C/C++ 相似，支持大多数熟悉的结构组件（for 循环、if 语句等），但存在一些重要的语言差异。

### 标准库

OpenGL 着色语言定义了许多标准函数。部分函数特定于某些着色器阶段，大多数可在任意阶段使用。[GLSL 函数参考文档](https://www.opengl.org/sdk/docs/manglsl/)提供了详细信息。

### 变量类型

GLSL 使用部分 C 语言基本类型，并添加了许多新类型：

| 类型类别 | 说明 |
|---------|------|
| 标量类型 | `float`、`int`、`uint`、`bool`、`double` |
| 向量类型 | `vec2`、`vec3`、`vec4` 及其变体 |
| 矩阵类型 | `mat2`、`mat3`、`mat4` 及其变体 |
| 采样器类型 | 各种纹理采样器 |
| 图像类型 | 图像加载/存储使用 |

### 类型限定符

GLSL 使用大量限定符来指定变量值的来源，并修改变量的使用方式：

| 限定符 | 用途 |
|-------|------|
| `const` | 编译时常量 |
| `in` | 输入变量 |
| `out` | 输出变量 |
| `inout` | 双向传递（函数参数） |
| `uniform` | 全局 uniform 变量 |
| `attribute` | 顶点属性（已弃用） |
| `varying` | 顶点到片段传递（已弃用） |

### 接口块

某些变量定义可以分组到接口块中，用于：
- 简化不同着色器阶段之间的通信
- 允许变量存储来自缓冲对象

### 预定义变量

不同着色器阶段有许多预定义变量，由系统提供用于各种系统特定用途。

## 使用 GLSL 着色器

### 构建着色器

#### 属性与绘制缓冲

管线起点和终点阶段（分别是顶点和片段着色器）的初始输入和最终输出不来自或不去往其他着色器阶段：

- **顶点着色器输入**：来自顶点数组对象中指定的顶点数据，在顶点渲染时从顶点缓冲对象获取
- **片段着色器输出**：发送到当前绑定帧缓冲的特定缓冲

因此存在程序输入输出的映射层：
- 顶点着色器输入名称映射到属性索引
- 片段着色器输出名称映射到绘制缓冲索引

映射可以在链接前创建，也可以让链接器自动定义。

### 设置 Uniform

**Uniform 变量** 是从用户代码设置的着色器变量，只能在不同的 `glDraw*` 调用之间更改。Uniform 可以：
- 从着色器外部查询和设置
- 组织成块，数据存储来自缓冲对象

#### 设置采样器

**采样器（Sampler）** 是必须定义为 uniform 的特殊类型，代表 OpenGL 上下文中绑定的纹理。设置方式类似于整数 1D uniform 值。

### 错误检查

以下代码展示了完整的着色器编译和链接流程，包含错误检查：

```cpp
// 读取着色器源码
std::string vertexSource = // 获取顶点着色器源码
std::string fragmentSource = // 获取片段着色器源码

// 创建顶点着色器
GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
const GLchar *source = (const GLchar *)vertexSource.c_str();
glShaderSource(vertexShader, 1, &source, 0);
glCompileShader(vertexShader);

// 检查编译状态
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

// 创建片段着色器
GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
source = (const GLchar *)fragmentSource.c_str();
glShaderSource(fragmentShader, 1, &source, 0);
glCompileShader(fragmentShader);

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

// 创建程序并链接着色器
GLuint program = glCreateProgram();
glAttachShader(program, vertexShader);
glAttachShader(program, fragmentShader);
glLinkProgram(program);

// 检查链接状态
GLint isLinked = 0;
glGetProgramiv(program, GL_LINK_STATUS, &isLinked);
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

// 链接成功后分离着色器
glDetachShader(program, vertexShader);
glDetachShader(program, fragmentShader);
```

::: tip
始终检查编译和链接错误！GLSL 编译器错误信息通常包含行号和详细错误描述。
:::

## 相关主题

- [Sampler (GLSL)](https://www.khronos.org/opengl/wiki/Sampler_(GLSL))
- [Uniform (GLSL)](https://www.khronos.org/opengl/wiki/Uniform_(GLSL))
- [Uniform Buffer Object](https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object)
- [GLSL: common mistakes](https://www.khronos.org/opengl/wiki/GLSL_:_common_mistakes)

## 外部链接

- [OpenGL Shading Language 规范](https://www.opengl.org/documentation/glsl/)
- [OpenGL 红皮书](https://www.opengl.org/documentation/red_book/)
- [OpenGL 蓝皮书](https://www.opengl.org/documentation/blue_book/)
