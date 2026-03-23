# 着色器存储缓冲对象（Shader Storage Buffer Object, SSBO）

着色器存储缓冲对象（SSBO）是用于在 OpenGL 着色语言（GLSL）中存储和检索数据的缓冲对象。

SSBO 与统一缓冲对象（UBO）非常相似：着色器存储块的定义方式与统一块几乎相同，存储 SSBO 的缓冲对象绑定到 SSBO 绑定点，就像 UBO 一样。

## 与 UBO 的主要区别

| 特性 | SSBO | UBO |
|------|------|-----|
| **最大大小** | 保证至少 128MB，通常可达 GPU 内存上限 | 保证至少 16KB |
| **可写性** | 可读写，支持原子操作 | 只读 |
| **存储大小** | 可变大小，支持运行时确定长度的数组 | 固定大小 |
| **访问速度** | 通常较慢 | 通常较快 |
| **内存一致性** | 需要 barrier 同步 | 无需同步 |

::: tip 性能考量
SSBO 访问通常比 UBO 慢。功能上，SSBO 可以视为通过图像加载存储（Image Load Store）访问的缓冲纹理（Buffer Texture）的更好接口。
:::

## 着色器声明

SSBO 在 GLSL 中使用 `buffer` 关键字声明为接口块：

```glsl
layout(std430, binding = 3) buffer DataBuffer {
    int data_SSBO[];
};
```

### 可变长度数组

SSBO 支持在块末尾声明可变长度数组：

```glsl
layout(std430, binding = 2) buffer AnotherBlock {
    int some_int;
    float fixed_array[42];
    float variable_array[];  // 必须是最后一个成员
};
```

着色器中可以使用 `length()` 函数获取数组长度：

```glsl
int count = variable_array.length();
```

## 内存限定符

存储块及其成员可以使用内存限定符：

| 限定符 | 说明 |
|--------|------|
| `coherent` | 强制内存访问一致性，允许多个着色器调用之间通信 |
| `volatile` | 告知编译器内存内容可能随时被外部修改 |
| `restrict` | 承诺该变量是唯一能修改其所见内存的变量，允许编译器优化 |
| `readonly` | 变量只能用于读取操作 |
| `writeonly` | 变量只能用于写入操作 |

```glsl
layout(std430, binding = 0) coherent restrict buffer MyBuffer {
    readonly int flags[];
    writeonly int results[];
};
```

::: info 限定符组合
`writeonly` 和 `readonly` 不是互斥的——同时标记的变量仍可查询资源信息（如 `image` 变量的大小）。
:::

### 内存同步

由于 SSBO 使用非一致内存访问，写入后需要适当的屏障：

```glsl
// 在同一工作组内同步
barrier();
memoryBarrierBuffer();

// 在计算着色器中使用共享变量后
memoryBarrierShared();
barrier();
```

## 原子操作

SSBO 支持 `int` 和 `uint` 类型的原子操作：

```glsl
int atomicAdd(inout int mem, int data);
int atomicMin(inout int mem, int data);
int atomicMax(inout int mem, int data);
int atomicAnd(inout int mem, int data);
int atomicOr(inout int mem, int data);
int atomicXor(inout int mem, int data);
int atomicExchange(inout int mem, int data);
int atomicCompSwap(inout int mem, int compare, int data);
```

::: info 返回值
所有原子函数返回操作**之前**的原始值。
:::

### 原子操作示例

```glsl
layout(std430, binding = 0) buffer Counter {
    uint globalCounter;
};

void increment() {
    uint old = atomicAdd(globalCounter, 1);
    // old 是增加前的值
}
```

## OpenGL 使用

### 创建和绑定

```cpp
int data[SIZE];

GLuint ssbo;
glGenBuffers(1, &ssbo);
glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
glBufferData(GL_SHADER_STORAGE_BUFFER, sizeof(data), data, GL_DYNAMIC_DRAW);
glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 3, ssbo);  // 绑定到绑定点 3
glBindBuffer(GL_SHADER_STORAGE_BUFFER, 0);  // 解绑
```

### 部分更新

```cpp
glBufferSubData(GL_SHADER_STORAGE_BUFFER, offset, size, data);
```

### 读取数据

```cpp
glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
void* ptr = glMapBuffer(GL_SHADER_STORAGE_BUFFER, GL_READ_ONLY);
// 读取数据
glUnmapBuffer(GL_SHADER_STORAGE_BUFFER);
```

### 内存屏障

SSBO 写入后，如果需要在后续绘制调用中使用，需要插入内存屏障：

```cpp
glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
```

## 数据结构映射

C/C++ 结构体可以映射到 SSBO：

```cpp
struct ssbo_data {
    int foo;
    float bar[42];
    float baz[MY_SIZE];
};
```

```glsl
layout(std430, binding = 0) buffer SSBOData {
    int foo;
    float bar[42];
    float baz[];
};
```

## 参考

- 核心版本：OpenGL 4.3
- 核心扩展：`ARB_shader_storage_buffer_object`
