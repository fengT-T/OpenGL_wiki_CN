# OpenGL 对象（OpenGL Objects）

## 概述

**OpenGL 对象（OpenGL Object）** 是 OpenGL 中用于封装特定状态的构造体。当对象被绑定到上下文（Context）时，它所包含的状态会被映射到上下文中。因此，对上下文状态的修改将存储在该对象中，而操作这些上下文状态的函数将使用对象中存储的状态。

OpenGL 被定义为一个**状态机（State Machine）**。各种 API 调用会改变 OpenGL 状态、查询状态的某些部分，或者使用当前状态来渲染内容。

对象始终是状态的容器。每种特定类型的对象由其包含的特定状态定义。OpenGL 对象是一种封装特定状态组并通过一次函数调用改变所有这些状态的方式。

::: tip 注意
这只是 OpenGL 规范中定义的对象和状态的交互方式。这些对象在驱动程序中的实际实现是另一回事。但你无需担心这一点；重要的是对象和状态如何按照规范进行交互。
:::

## 对象创建与销毁（Object Creation and Destruction）

### 生成对象名称（Generating Object Names）

要创建对象，首先需要生成对象的**名称（Name）**（一个整数）。这会创建对对象的引用。然而，这并不一定会创建对象的状态数据。对于大多数对象类型，对象只有在首次绑定到上下文时才包含其默认状态；在绑定之前，尝试使用它将失败。不遵循此行为的对象是**程序管线对象（Program Pipeline Objects）**和**采样器对象（Sampler Objects）**。

生成对象名称的函数形式为 `glGen*`，其中 `*` 是对象类型的复数形式。所有此类函数都具有相同的签名：

```cpp
void glGen*(GLsizei n, GLuint *objects);
```

此函数生成 `n` 个给定类型的对象，将它们存储在 `objects` 参数指定的数组中。这允许你通过一次调用创建多个对象。

对象名称始终是 `GLuint`。这些名称不是指针，你也不应该假设它们是。它们是引用，用于标识对象的数字。它们可以是除 0 以外的任何 32 位无符号整数。数字 0 保留用于特殊用例。

::: warning 遗留说明
在 OpenGL 3.0 之前的版本中，用户可以完全忽略生成步骤。用户可以自行决定 "3" 是一个有效的对象名称，将其绑定到上下文以创建其默认状态，然后开始像使用对象一样使用它。实现必须接受这一点，并在你开始使用时在幕后创建对象。在 GL 3.0 中，此行为已被弃用（Deprecated）。在核心（Core）GL 3.1 及更高版本中，不再允许这样做。无论 OpenGL 的版本如何，始终建议使用 `glGen*` 而不是自己编造对象名称。
:::

### 删除对象（Deleting Objects）

当你完成对象的使用后，应该删除它。用于此目的的函数形式为 `glDelete*`，使用与之前相同的对象类型。这些函数具有以下签名：

```cpp
void glDelete*(GLsizei n, const GLuint *objects);
```

这与 `glGen*` 函数类似，只是它删除对象而不是创建它们。任何不是有效对象或是对象 0 的值都将被静默忽略。

当 OpenGL 对象被删除时，它们的名称不再被视为有效。在此调用之后，后续的 `glGen*` 调用可能会也可能不会重用先前删除的名称；你不应该对任何一种情况做出假设。

### 直接状态访问（Direct State Access, DSA）

随着**直接状态访问（Direct State Access, DSA）**的引入，上述对象创建过程变得更加简单。对于每个 `glGen*` 函数，它引入了新的 `glCreate*` 函数，将名称生成和对象创建合并为一步——意味着对象立即创建，而不是在首次绑定时创建。

大多数这些函数与其 `glGen*` 对应函数具有相同的签名：

```cpp
void glCreate*(GLsizei n, GLuint *objects);
```

以下函数除外，它们需要一个 `target` 参数来创建对象，而以前这个参数是在首次绑定时提供的：

```cpp
void glCreateTextures(GLenum target, GLsizei n, GLuint *objects);
void glCreateQueries(GLenum target, GLsizei n, GLuint *objects);
```

### 删除时的解绑（Deletion Unbinding）

当对象被删除时，如果该对象绑定到当前上下文（注意这只适用于当前上下文），则该对象将从上下文的所有绑定中解除绑定。

::: info 注意
这影响的是"绑定（Binding）"，而不是"附加（Attachment）"。对象绑定到上下文，而附加是指一个对象引用另一个对象。附加不会因此调用而断开。
:::

此外，如果对象附加到任何**容器对象（Container Objects）**，并且该对象本身绑定到当前上下文，则该对象将从容器对象中分离。如果它附加到未绑定到当前上下文的对象，则附加**不会**被破坏。

一些对象可以以不寻常的方式绑定到上下文，包括：
- 通过 `glBindBufferRange` 或其等效函数绑定到索引目标（Indexed Targets）的**缓冲区对象（Buffer Objects）**
- 作为**图像（Images）**绑定的**纹理（Textures）**

在 OpenGL 4.4 及更低版本中，当对象被删除时，这些绑定**不会**被取消。这些版本中唯一被取消的绑定是可以通过调用对象类型的基本 `glBind*` 函数来取消的绑定。

OpenGL 4.5 及以上版本甚至会从这些不寻常的绑定方法中取消绑定。这些"绑定"被重置为默认状态。同样，请记住这只发生在**当前（Current）** OpenGL 上下文中。

### 删除孤儿化（Deletion Orphaning）

在对象上调用 `glDelete*` 并不能保证该对象内容的**立即**销毁。此外，它甚至不能保证对象名称的立即销毁，因为对象名称在删除后仍可能被使用。如果对象在删除后仍在"使用中"，则该对象将在 OpenGL 实现中保持活动状态。

当满足以下条件时，对象处于"使用中"：
- 它绑定到上下文。这不一定是当前上下文，因为删除它会自动将其从导致删除的上下文中解除绑定。
- 它附加到**容器对象（Container Object）**。

因此，如果**纹理（Texture）**附加到未绑定到上下文的**帧缓冲对象（Framebuffer Object, FBO）**，则在删除纹理后，FBO 仍将正常工作。只有当 FBO 被删除或用新的纹理附件替换旧的附件时，纹理才会最终被完全删除。

## 对象使用（Object Usage）

由于 OpenGL 中的对象被定义为状态的集合，要修改对象，必须首先将它们绑定到 OpenGL 上下文。将对象绑定到上下文会导致其中的状态被设置为当前上下文的状态。这意味着任何改变该对象管理的状态的函数将简单地改变对象内的状态，从而保留该状态。

绑定新生成的对象名称将为该对象创建新状态。在某些情况下，它首次绑定的目标（见下文）将影响对象新创建状态的属性。

::: info 注意
上述仅适用于通过 `glGen*` 函数生成的名称。与通过 `glCreate*` 生成的名称关联的对象在绑定之前就已经被创建了。
:::

不同的对象有不同的绑定函数。它们共享命名约定和一般参数：

```cpp
void glBind*(GLenum target, GLuint object);
```

`*` 是对象类型，`object` 是要绑定的对象。

`target` 是不同对象类型的区别所在。一些对象可以绑定到上下文中的多个目标，而其他对象只能绑定到单个特定位置。例如，缓冲区对象可以作为数组缓冲区（Array Buffer）、索引缓冲区（Index Buffer）、像素缓冲区（Pixel Buffer）、变换缓冲区（Transform Buffer）或各种其他可能性绑定。

不同的目标有单独的绑定。因此，你可以将一个缓冲区对象绑定为顶点属性数组，将另一个缓冲区对象绑定为索引缓冲区。

如果一个对象绑定到另一个对象已经绑定的位置，先前绑定的对象将被解除绑定。

### 对象零（Object Zero）

`GLuint` 值 0 被 OpenGL 对象特殊处理。然而，一些对象以不同的方式处理它。0 永远不会被 `glGen*` 函数返回。

对于大多数对象类型，对象 0 非常像 NULL 指针：它不是一个对象。如果为这种对象类型绑定了 0，则尝试将绑定的对象用于渲染目的将失败。

对于某些对象，对象 0 代表一种"默认对象"。**纹理（Texture）**有一个默认纹理。然而，默认纹理非常复杂；纹理对象 0 技术上代表**多个**默认纹理。此外，默认纹理不能以许多常规纹理对象可以使用的方式使用。例如，你不能将它们的图像附加到**帧缓冲对象（FBO）**。因此，强烈建议你将纹理 0 视为不存在的纹理。

对于**帧缓冲（Framebuffer）**，对象 0 代表**默认帧缓冲（Default Framebuffer）**。它具有与适当的**帧缓冲对象（Framebuffer Object）**类似的状态，但它具有非常不同的图像集和自己的图像名称。此外，这些图像不能被附加/分离；这意味着许多**FBO 特定接口**在对象 0 上不起作用。

::: tip 建议
除了**帧缓冲对象（Framebuffer Objects）**之外，你应该将对象 0 视为非功能性对象。即使对象类型具有有效的对象 0，你也应该将其视为没有。像对待 C/C++ 中的 NULL 指针一样对待它；你可以将它存储在指针中，但在将真实值放入其中之前，你不能**使用**该指针。
:::

## 多重绑定（Multibind）

许多对象类型可以绑定到特定的、编号的目标。因此，能够将一组对象一次性绑定到一系列目标是有用的。

重要的是要注意，许多这些多重绑定形式只能用于使用对象，而不能用于修改它们。

这些函数与单绑定函数之间的一个主要区别是：这些函数都接受要绑定的对象数组。如果数组中的某个对象无法绑定，如果使用单个调用绑定它会导致某种**OpenGL 错误（OpenGL Error）**，则该对象的绑定将失败并返回 `GL_INVALID_OPERATION`。

不同之处在于，几乎每一个因错误而失败的其他 OpenGL 函数都不会有任何效果。相比之下，如果多重绑定函数发出错误，它**可能仍然会产生效果**。如果数组中的某个特定对象由于任何原因无法绑定，**其余**可以绑定的对象仍将被绑定。只有对那个特定编号绑定点的绑定会失败。如果甚至一个对象无法绑定，多重绑定函数仍会发出适当的错误。

请注意，这只适用于由于无法绑定特定对象或特定对象的参数不正确而导致的错误。由于无效的缓冲区绑定范围等导致的错误不会改变任何绑定。

这些函数接受的要绑定的对象数组可以为 NULL。如果是这样，它将把 0 绑定到范围内所有编号的目标。这使得解除范围内所有内容的绑定变得容易。

可以多重绑定的对象及其允许多重绑定的特定用途如下：
- 绑定到索引缓冲区绑定目标的**缓冲区对象（Buffer Objects）**
- 为顶点数据中的单独属性缓冲区绑定的**缓冲区对象（Buffer Objects）**
- 被 GLSL 采样器使用的**纹理（Textures）**和**采样器对象（Sampler Objects）**
- 用于图像加载/存储操作的**纹理（Textures）**

## 对象共享（Object Sharing）

你可以创建多个**OpenGL 上下文（OpenGL Contexts）**。这很有用，因为当前 GL 上下文是线程特定的。通常，每个上下文完全独立于其他上下文；在一个上下文中执行的任何操作都不能影响其他上下文。

然而，在上下文创建时，你可以创建一个与另一个现有上下文共享对象的上下文。这意味着你可以在一个上下文中使用在另一个上下文中创建的对象。

并非所有对象类型都可以跨上下文共享。**包含对其他对象引用的对象**和**查询对象（Query Objects）**不能被共享。所有其他对象类型都可以共享。这包括**GLSL 对象（GLSL Objects）**和**同步对象（Sync Objects）**，它们不遵循 OpenGL 对象模型。

请注意，在一个上下文中对对象所做的状态更改不一定在另一个上下文中立即可见。有**管理对象状态数据可见性的特定规则**。如果你使用多线程，你需要自己进行一些同步，以确保在一个上下文中进行的更改已经完成，然后才尝试在另一个上下文中使用这些更改。

## 对象类型（Object Types）

对象可以分为两个不同的类别：常规对象（Regular Objects）和容器对象（Container Objects）。

### 常规对象（Regular Objects）

- **缓冲区对象（Buffer Objects）**
- **查询对象（Query Objects）**
- **渲染缓冲对象（Renderbuffer Objects）**
- **采样器对象（Sampler Objects）**
- **纹理对象（Texture Objects）**

### 容器对象（Container Objects）

- **帧缓冲对象（Framebuffer Objects）**
- **程序管线对象（Program Pipeline Objects）**
- **变换反馈对象（Transform Feedback Objects）**
- **顶点数组对象（Vertex Array Objects）**

## 对象命名（Object Names）

**OpenGL 对象（OpenGL Objects）**以及非标准对象（如**程序对象（Program Objects）**和**同步对象（Sync Objects）**）非常有用。然而，它们的名称不直观；它们只是数字（在同步对象的情况下是指针）。此外，这些数字由系统定义，而不是由用户定义。这使得使用对象进行调试变得困难。

然而，OpenGL 提供了一种将任意字符串名称与任何对象关联的机制。这还允许**系统生成的消息（System-generated Messages）**能够通过其字符串名称来谈论对象。为对象设置名称的函数是：

```cpp
void glObjectLabel(GLenum identifier, GLuint name, GLsizei length, const char *label);
void glObjectPtrLabel(void *ptr, GLsizei length, const char *label);
```

第一个函数用于设置所有使用 `GLuint` 的对象类型。这包括所有**OpenGL 对象**以及所有**着色器/程序对象（Shader/Program Objects）**类型。第二个函数为**同步对象（Sync Objects）**设置名称。

对于基于 `GLuint` 的对象，仅对象名称不足以标识对象，因为两个不同类型的对象可能具有相同的 `GLuint` 名称。因此，类型由 `identifier` 参数指定，必须是以下枚举器之一：

| 标识符（Identifier） | 对象类型（Object Type） |
|---------------------|------------------------|
| `GL_BUFFER` | 缓冲区对象（Buffer Object） |
| `GL_SHADER` | 着色器对象（Shader Object） |
| `GL_PROGRAM` | 程序对象（Program Object） |
| `GL_VERTEX_ARRAY` | 顶点数组对象（Vertex Array Object） |
| `GL_QUERY` | 查询对象（Query Object） |
| `GL_PROGRAM_PIPELINE` | 程序管线对象（Program Pipeline Object） |
| `GL_TRANSFORM_FEEDBACK` | 变换反馈对象（Transform Feedback Object） |
| `GL_SAMPLER` | 采样器对象（Sampler Object） |
| `GL_TEXTURE` | 纹理对象（Texture Object） |
| `GL_RENDERBUFFER` | 渲染缓冲对象（Renderbuffer Object） |
| `GL_FRAMEBUFFER` | 帧缓冲对象（Framebuffer Object） |

`length` 指定字符串 `label` 的长度，必须小于 `GL_MAX_LABEL_LENGTH`（不少于 256）。

对象的名称可能被引用该对象的调试输出消息使用。这不是必需的，但可能对调试目的有用。

要检索对象的名称，可以使用以下函数：

```cpp
void glGetObjectLabel(GLenum identifier, GLuint name, GLsizei bufSize, GLsizei *length, char *label);
void glGetObjectPtrLabel(void *ptr, GLsizei bufSize, GLsizei *length, char *label);
```

`bufSize` 是 `label` 中的总字节数；该函数不会将超过此字节数（包括空终止符）复制到 `label` 中。

## 非标准对象（Non-standard Objects）

以下是"对象"，但它们不遵循本页为 OpenGL 对象规定的标准约定：

- **同步对象（Sync Objects）**
- **着色器和程序对象（Shader and Program Objects）**
  - 程序管线对象（Program Pipeline Objects）除外，它**确实**遵循 OpenGL 对象约定。

## 总结

OpenGL 对象是管理图形状态的核心机制。理解对象的创建、绑定、使用和删除对于有效使用 OpenGL 至关重要。通过使用直接状态访问（DSA）和现代 OpenGL 特性，可以更高效地管理这些对象，减少状态切换的开销，提高渲染性能。
