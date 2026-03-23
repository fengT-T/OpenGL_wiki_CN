# 程序内省 (Program Introspection)

程序内省是一种从程序对象查询信息的机制，以便能够与其交互。例如，如果有 uniform 变量，可能需要查询其位置以便设置其值。

## 命名规则

内省 API 通常会使 GLSL 中的单个"变量"定义看起来像多个变量。这是针对非基本类型或非基本类型数组的变量。

### 结构体

考虑以下示例：

```glsl
struct A_Struct {
    vec4 first;
    vec2 second;
    vec2 third[3];
};

uniform A_Struct unif;
```

结构体本身无法通过内省 API 查询。`unif` 是 `A_Struct` 类型的 uniform 变量，但无法获取 `unif` 的位置或属性。

相反，结构体的每个基本类型子元素都是可见的：
- `unif.first` - vec4 类型
- `unif.second` - vec2 类型
- `unif.third[0]` - vec2 数组，大小为 3

对于嵌套结构体：

```glsl
struct Inner {
    vec2 inOne;
    vec4 inTwo;
};

struct Outer {
    vec4 first;
    Inner data;
    vec2 second;
    vec2 third[3];
};

uniform Outer unif;
```

生成的 uniform 变量为：`unif.first`、`unif.data.inOne`、`unif.data.inTwo`、`unif.second`、`unif.third[0]`。

### 数组

基本类型数组表示单个资源：

```glsl
uniform vec3 anArray[7];
```

`anArray[0]` 是类型为 `vec3` 的单个资源，数组大小为 7。查询时可以使用 `anArray` 或 `anArray[0]`，但查询名称时总是返回带 "[0]" 的版本。

聚合类型（结构体或数组）的数组更复杂，每个单独的数组元素被视为具有不同名称的单独资源：

```glsl
struct Aggregate {
    vec2 main;
    vec2 sec[3];
};

uniform Aggregate unifArray[5];
```

没有名为 `unifArray` 的 uniform，但有：
- `unifArray[0].main`
- `unifArray[2].sec[0]`

### 接口块数组

接口块可以数组化：

```glsl
uniform BlockName {
    ...
} instanceName[3];
```

这将创建三个接口块，命名为 `BlockName[0]`、`BlockName[1]`、`BlockName[2]`。

### 接口块成员命名

如果接口块有实例名称，成员名称将以**块名称**（而非实例名称）为前缀：

```glsl
uniform BlockName {
    int mem;
};

uniform BlockName2 {
    int mem;
} instanceName2;
```

第一个 uniform 名称为 "mem"，第二个为 "BlockName2.mem"（在内省 API 中），但在 GLSL 着色器中称为 "instanceName2.mem"。

### 着色器存储块

着色器存储块成员的数组规则略有不同。它们有"顶层数组"的概念：

```glsl
buffer SSBlock {
    vec2 first[10];
    vec3 double_dim[2][5];
    vec4 triple_dim[5][4][8];
};
```

- `first[0]` 是顶层数组，类型为 `vec2`，顶层数组大小为 10
- `double_dim[0][0]` 是顶层数组，顶层数组大小为 2，常规数组大小为 5，类型为 `vec3`
- `triple_dim[0][0][0]` 是顶层数组，顶层数组大小为 5，常规数组大小为 8

## 旧式 API

以下 API 代表较旧的程序信息接口。如果 OpenGL 4.3 或 `ARB_program_interface_query` 可用，应使用新 API。

::: warning
新 API 是查询以下信息的唯一方式：
- 着色器存储块信息及其中的缓冲区变量
- 片段着色器输出变量信息
- 变换反馈输出变量和缓冲区关联信息
- 分离程序中着色器阶段之间的输入/输出
:::

### 属性 (Attributes)

如果程序有顶点着色器，顶点着色器输入（即顶点属性）可以查询：

```cpp
void glGetActiveAttrib(GLuint program, GLuint index, GLsizei bufSize, 
                       GLsizei *length, GLint *size, GLenum *type, char *name);
```

`index` 是 [0, `GL_ACTIVE_ATTRIBUTES`) 范围内的数字。

获取属性位置：

```cpp
GLint glGetAttribLocation(GLuint program, const char *name);
```

如果 `name` 不是活动属性，返回 -1。

### 片段输出 (Fragment Outputs)

查询片段颜色编号和索引：

```cpp
GLint glGetFragDataLocation(GLuint program, const char *name);
GLint glGetFragDataIndex(GLuint program, const char *name);
```

### Uniform 变量和块

所有 uniform 变量（无论是否在 uniform 块中）在程序链接时都会分配一个索引。这与 uniform 位置或 uniform 块索引不同。

获取活动 uniform 数量：

```cpp
glGetProgramiv(program, GL_ACTIVE_UNIFORMS, &num);
```

从名称获取索引：

```cpp
void glGetUniformIndices(GLuint program, GLsizei uniformCount, 
                         const char **uniformNames, GLuint *uniformIndices);
```

查询 uniform 属性：

```cpp
void glGetActiveUniformsiv(GLuint program, GLsizei uniformCount, 
                           const GLuint *uniformIndices, GLenum pname, GLint *params);
```

`pname` 可以是：
- `GL_UNIFORM_TYPE` - uniform 的类型
- `GL_UNIFORM_SIZE` - 数组大小（非数组为 1）
- `GL_UNIFORM_NAME_LENGTH` - 名称长度
- `GL_UNIFORM_BLOCK_INDEX` - 所在的 uniform 块索引（不在块中则为 -1）
- `GL_UNIFORM_OFFSET` - 在 uniform 块中的字节偏移
- `GL_UNIFORM_ARRAY_STRIDE` - 数组元素的字节步长
- `GL_UNIFORM_MATRIX_STRIDE` - 矩阵列/行的字节步长
- `GL_UNIFORM_IS_ROW_MAJOR` - 是否为行主序矩阵
- `GL_UNIFORM_ATOMIC_COUNTER_BUFFER_INDEX` - 原子计数器缓冲区索引

#### Uniform 块

获取 uniform 块索引：

```cpp
GLuint glGetUniformBlockIndex(GLuint program, const GLchar *name);
```

查询 uniform 块属性：

```cpp
void glGetActiveUniformBlockiv(GLuint program, GLuint uniformBlockIndex, 
                               GLenum pname, GLint *params);
```

`pname` 可以是：
- `GL_UNIFORM_BLOCK_BINDING` - 当前块绑定
- `GL_UNIFORM_BLOCK_DATA_SIZE` - 所需缓冲区存储大小
- `GL_UNIFORM_BLOCK_NAME_LENGTH` - 块名称长度
- `GL_UNIFORM_BLOCK_ACTIVE_UNIFORMS` - 块中活动 uniform 数量
- `GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES` - 块中 uniform 的索引数组
- `GL_UNIFORM_BLOCK_REFERENCED_BY_*` - 是否被特定着色器阶段引用

### 子程序 (Subroutines)

子程序资源按着色器阶段分解，所有查询函数都需要 `shadertype` 参数：

```cpp
GLuint glGetSubroutineIndex(GLuint program, GLenum shadertype, const GLchar *name);
void glGetProgramStageiv(GLuint program, GLenum shadertype, GLenum pname, GLint *values);
void glGetActiveSubroutineName(GLuint program, GLenum shadertype, GLuint index, 
                               GLsizei bufsize, GLsizei *length, GLchar *name);
void glGetActiveSubroutineUniformiv(GLuint program, GLenum shadertype, GLuint index, 
                                    GLenum pname, GLint *values);
GLint glGetSubroutineUniformLocation(GLuint program, GLenum shadertype, const GLchar *name);
```

### 原子计数器 (Atomic Counters)

原子计数器变量既是 opaque 类型也是 uniform 变量。缓冲区绑定信息需要专门查询：

```cpp
void glGetActiveAtomicCounterBufferiv(GLuint program, GLuint bufferIndex, 
                                      GLenum pname, GLint *params);
```

`pname` 可以是：
- `GL_ATOMIC_COUNTER_BUFFER_BINDING` - 缓冲区绑定索引
- `GL_ATOMIC_COUNTER_BUFFER_DATA_SIZE` - 所需最小缓冲区大小
- `GL_ATOMIC_COUNTER_BUFFER_ACTIVE_ATOMIC_COUNTERS` - 活动计数器数量
- `GL_ATOMIC_COUNTER_BUFFER_ACTIVE_ATOMIC_COUNTER_INDICES` - 计数器索引数组
- `GL_ATOMIC_COUNTER_BUFFER_REFERENCED_BY_*` - 是否被特定着色器阶段引用

## 接口查询 API

OpenGL 4.3 引入了统一的机制来查询程序中的几乎所有内容。

### 接口类型

接口表示一组活动资源，由枚举器标识：

- `GL_UNIFORM` - 活动 uniform 变量集合
- `GL_UNIFORM_BLOCK` - 活动 uniform 块集合
- `GL_ATOMIC_COUNTER_BUFFER` - 活动原子计数器缓冲区集合
- `GL_PROGRAM_INPUT` - 第一个着色器阶段的活动用户定义输入
- `GL_PROGRAM_OUTPUT` - 最后一个着色器阶段的活动用户定义输出
- `GL_TRANSFORM_FEEDBACK_VARYING` - 变换反馈输出变量
- `GL_TRANSFORM_FEEDBACK_BUFFER` - 变换反馈缓冲区
- `GL_BUFFER_VARIABLE` - 着色器存储块中的缓冲区变量
- `GL_SHADER_STORAGE_BLOCK` - 着色器存储块
- `GL_*_SUBROUTINE` - 特定着色器阶段的活动子程序
- `GL_*_SUBROUTINE_UNIFORM` - 特定着色器阶段的活动子程序 uniform

### 查询接口信息

```cpp
void glGetProgramInterfaceiv(GLuint program, GLenum programInterface, 
                             GLenum pname, GLint *params);
```

`pname` 可以是：
- `GL_ACTIVE_RESOURCES` - 该接口类型的活动资源数量
- `GL_MAX_NAME_LENGTH` - 最长名称长度（包含 null 终止符）
- `GL_MAX_NUM_ACTIVE_VARIABLES` - 最大活动变量数量
- `GL_MAX_NUM_COMPATIBLE_SUBROUTINES` - 最大兼容子程序数量

### 资源索引

活动资源在概念上存储在连续数组中，每个资源有唯一的从零开始的索引。

按名称查询索引：

```cpp
GLuint glGetProgramResourceIndex(GLuint program, GLenum programInterface, const char *name);
```

如果资源不是活动的，返回 `GL_INVALID_INDEX`。

### 资源属性

```cpp
void glGetProgramResourceiv(GLuint program, GLenum programInterface, GLuint index, 
                            GLsizei propCount, const GLenum *props, GLsizei count, 
                            GLsizei *length, GLint *params);
```

重要属性：
- `GL_NUM_ACTIVE_VARIABLES` 和 `GL_ACTIVE_VARIABLES` - 块中包含的变量
- `GL_REFERENCED_BY_*_SHADER` - 检测哪些着色器阶段使用该变量

获取资源名称：

```cpp
GLuint glGetProgramResourceName(GLuint program, GLenum programInterface, GLuint index, 
                                GLsizei bufSize, GLsizei *length, char *name);
```

### 快捷方式

对于常用信息有专门的函数：

```cpp
GLint glGetProgramResourceLocation(GLuint program, GLenum programInterface, const char *name);
GLint glGetProgramResourceLocationIndex(GLuint program, GLenum programInterface, const char *name);
```

### 示例

遍历所有非块 uniform 变量：

```cpp
GLint numUniforms = 0;
glGetProgramInterfaceiv(prog, GL_UNIFORM, GL_ACTIVE_RESOURCES, &numUniforms);
const GLenum properties[4] = {GL_BLOCK_INDEX, GL_TYPE, GL_NAME_LENGTH, GL_LOCATION};

for(int unif = 0; unif < numUniforms; ++unif) {
    GLint values[4];
    glGetProgramResourceiv(prog, GL_UNIFORM, unif, 4, properties, 4, NULL, values);
    
    if(values[0] != -1)  // 跳过块中的 uniform
        continue;
    
    std::vector<char> nameData(values[2]);
    glGetProgramResourceName(prog, GL_UNIFORM, unif, nameData.size(), NULL, &nameData[0]);
    std::string name(nameData.begin(), nameData.end() - 1);
}
```

遍历每个 uniform 块中的所有 uniform：

```cpp
GLint numBlocks = 0;
glGetProgramInterfaceiv(prog, GL_UNIFORM_BLOCK, GL_ACTIVE_RESOURCES, &numBlocks);
const GLenum blockProperties[1] = {GL_NUM_ACTIVE_VARIABLES};
const GLenum activeUnifProp[1] = {GL_ACTIVE_VARIABLES};
const GLenum unifProperties[3] = {GL_NAME_LENGTH, GL_TYPE, GL_LOCATION};

for(int blockIx = 0; blockIx < numBlocks; ++blockIx) {
    GLint numActiveUnifs = 0;
    glGetProgramResourceiv(prog, GL_UNIFORM_BLOCK, blockIx, 1, blockProperties, 1, NULL, &numActiveUnifs);
    
    if(!numActiveUnifs) continue;
    
    std::vector<GLint> blockUnifs(numActiveUnifs);
    glGetProgramResourceiv(prog, GL_UNIFORM_BLOCK, blockIx, 1, activeUnifProp, numActiveUnifs, NULL, &blockUnifs[0]);
    
    for(int unifIx = 0; unifIx < numActiveUnifs; ++unifIx) {
        GLint values[3];
        glGetProgramResourceiv(prog, GL_UNIFORM, blockUnifs[unifIx], 3, unifProperties, 3, NULL, values);
        
        std::vector<char> nameData(values[0]);
        glGetProgramResourceName(prog, GL_UNIFORM, blockUnifs[unifIx], nameData.size(), NULL, &nameData[0]);
        std::string name(nameData.begin(), nameData.end() - 1);
    }
}
```
