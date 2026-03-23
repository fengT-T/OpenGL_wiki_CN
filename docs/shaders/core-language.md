# 核心语言 (Core Language)

OpenGL Shading Language（GLSL）是一种 C 风格语言，涵盖了您对这类语言所期望的大多数特性。GLSL 中存在控制结构（for 循环、if-else 语句等），包括 `switch` 语句。本文将重点说明 GLSL 与 C 之间的差异。

## 编译设置

GLSL 的编译模型要求某些信息在着色器对象编译早期呈现。这些信息应该是与着色器对象关联的第一个字符串的前几行。

### 版本声明

GLSL 经历了多次修订。要指定用于编译/链接着色器的 GLSL 版本，使用以下指令：

```glsl
#version 150
```

这告诉编译器使用版本 1.50 进行编译，如果该版本不可用则报错。

版本号后可以跟配置文件名称：`core` 或 `compatibility`。如果未指定配置文件，默认为 `core`。

`#version` 指令必须出现在着色器中任何其他内容之前，只能有空白和注释。如果顶部没有出现 `#version` 指令，则假定版本为 1.10。

#### OpenGL 与 GLSL 版本对照

| OpenGL 版本 | GLSL 版本 |
|-------------|-----------|
| 2.0 | 1.10 |
| 2.1 | 1.20 |
| 3.0 | 1.30 |
| 3.1 | 1.40 |
| 3.2 | 1.50 |
| 3.3+ | 与 OpenGL 版本相同（如 GL 4.1 = GLSL 4.10） |

### 扩展

GLSL 扩展必须在特定着色器字符串中显式指定：

```glsl
#extension extension_name : behavior
```

`extension_name` 也可以是字符串 `all`，表示适用于所有扩展。可用的行为包括：

| 行为 | 说明 |
|------|------|
| `enable` | 启用扩展，不支持时仅警告。不能与 `all` 一起使用 |
| `require` | 启用扩展，不支持时报错。不能与 `all` 一起使用 |
| `warn` | 启用扩展，使用时发出警告 |
| `disable` | 禁止扩展，任何使用都会报错 |

## 预处理指令

GLSL 提供了大多数标准 C 预处理指令集（`#define`、`#if` 等），最显著的遗漏是 `#include`。宏展开对 `#version` 和 `#extension` 指令不起作用。

### #line 指令

`#line` 指令允许更改当前的 `__FILE__` 和 `__LINE__` 值：

```glsl
#line line
#line line source-string-number
```

`#line` 指令后的源代码行将被设置为给定的行号。

### 标准宏

GLSL 定义了多个宏：

| 宏 | 说明 |
|----|------|
| `__FILE__` | 传递给着色器的字符串列表中的字符串索引（十进制整数） |
| `__LINE__` | 行号 |
| `__VERSION__` | 正在编译的 GLSL 版本（如版本 3.30 则为 330） |
| `GL_core_profile` | 始终定义为 1 |
| `GL_compatibility_profile` | 仅当着色器版本设置为 `compatibility` 时定义为 1 |

## 保留名称

GLSL 保留任何以 `gl_` 开头的名称；尝试定义以此开头的变量或函数将导致错误。此外，GLSL 有许多关键字，不能在任何上下文中用作标识符。

## 类型

GLSL 定义了多种类型。有些对 C/C++ 用户来说很熟悉，其他的则相当不同。

详见 [数据类型](./data-types.md)。

## 限定符

在全局和局部作用域声明的变量可以有多种与之关联的限定符。其中大多数是着色语言独有的的。

详见 [类型限定符](./type-qualifiers.md)。

## 表达式

GLSL 有一些独特的表达式定义。

### 常量表达式

常量表达式（constant expression）是可以在编译时计算的表达式。GLSL 中的常量表达式由以下组成：

- 字面值
- `const` 限定的变量（不是函数参数），带有显式初始化器
- 数组的 `length()` 函数结果（仅当数组有显式大小时）
- 大多数运算符的结果（只要所有操作数都是常量表达式）
- 类型构造函数的结果（只要所有参数都是常量表达式）
- 内置函数的返回值（只要所有参数都是常量表达式）

::: info
不透明类型（Opaque Types）永远不是常量表达式。函数 `dFdx`、`dFdy`、`fwidth` 及其变体在参数为常量表达式时返回 0。
:::

#### 整型常量表达式

结果是整数（有符号或无符号）的常量表达式。

### 动态一致表达式

动态一致表达式（Dynamically Uniform Expression）是 GLSL 表达式，其中特定调用组内的所有着色器调用都将具有相同的值。

::: info
只有 GLSL 4.00 及以上版本才区分动态一致表达式。在较旧的 GLSL 版本中，需要"动态一致表达式"的限制将要求"常量表达式"。
:::

始终是动态一致的表达式包括：

- 常量表达式
- Uniform 值
- 不涉及用户定义函数调用、图像加载存储或 SSBO 操作的表达式（其输入值都是动态一致的）
- 顶点着色器的 `gl_DrawID` 输入

#### 调用组

动态一致表达式基于"同一调用组"内的着色器调用。

- **计算着色器**：工作组内的所有调用
- **渲染命令**：单个绘制命令创建的所有着色器阶段的所有调用

对于多绘制命令（包括间接版本），每个内部绘制有单独的作用域。

#### 用途

以下情况必须使用动态一致表达式：

- 不透明类型数组的数组索引
- 缓冲区支持的接口块数组的索引
- 计算着色器中导致 `barrier()` 调用的表达式

#### 示例

```glsl
in vec3 fromPrevious;
in uvec2 fromRange;

const int foo = 5;
const uvec2 range = uvec2(2, 5);
uniform vec2 pairs;

uniform sampler2d tex;

void main()
{
  foo; // 常量表达式是动态一致的
  
  uint value = 21; // 'value' 是动态一致的
  value = range.x; // 仍然是动态一致的
  value = range.y + fromRange.y; // 不是动态一致的
  value = 4; // 又是动态一致的了
  
  if (fromPrevious.y < 3.14)
    value = 12;
  value; // 不是动态一致的，内容取决于输入变量 'fromPrevious'

  float number = abs(pairs.x); // 'number' 是动态一致的
  number = sin(pairs.y); // 仍然是动态一致的
  number = cos(fromPrevious.x); // 不是动态一致的

  vec4 colors = texture(tex, pairs.xy); // 动态一致的，使用相同纹理坐标
  colors = texture(tex, fromPrevious.xy); // 不是动态一致的

  for(int i = range.x; i < range.y; ++i)
  {
    i; // 'i' 是动态一致的，循环使用动态一致表达式初始化和比较
  }

  for(int i = fromRange.x; i < fromRange.y; ++i)
  {
    i; // 'i' 不是动态一致的
  }
}
```

## 函数

GLSL 中可以定义函数。函数声明和定义与 C/C++ 类似，但有一些注意事项。

### 递归

GLSL **不支持递归**。GLSL 内存模型不允许递归函数调用。这允许 GLSL 在根本不允许递归的硬件上执行。

### 参数

GLSL 函数使用"值返回"调用约定。传递给函数的值在调用时复制到参数中，输出在函数返回时复制出来。

```glsl
void MyFunction(in float inputValue, out int outputValue, inout float inAndOutValue);
```

| 限定符 | 说明 |
|--------|------|
| `in`（默认） | 值复制到参数中，函数内的修改不影响调用代码 |
| `out` | 参数不被调用者初始化，函数修改后值复制回调用者指定的变量 |
| `inout` | 结合两者，值被初始化并输出 |

::: warning
对于 `out` 或 `inout` 参数，调用者必须传递左值（l-value），不能是表达式、着色器输入、uniform 或 `const` 值。
:::

参数可以定义 `const`，表示不能被修改。`const` 限定符必须在 `in` 之前。

## 控制流

GLSL 使用标准 C/C++ 语句集：

- **选择语句**：`if-else`、`switch-case`
- **迭代语句**：`for`、`while`、`do-while`
- **跳转语句**：`break`、`continue`、`return`

::: warning
GLSL 没有 `goto` 构造。
:::

### discard

`discard` 关键字只能在片元着色器中使用。它导致片元着色器的结果被丢弃并被管线的其余部分忽略。

::: info
这并不意味着片元着色器在到达 `discard` 命令后实际上停止处理。通常，片元着色器被分成四个一组；只要其中一个在运行，它们都必须运行并执行相同的代码。
:::

使用 `discard` 与从 main 返回不同。执行 return 仍意味着写入着色器输出的值将被管线的其余部分使用。执行 `discard` 意味着它们不会被使用。
