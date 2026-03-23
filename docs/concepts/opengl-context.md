# OpenGL Context（OpenGL 上下文）

**OpenGL Context（OpenGL 上下文）** 是 OpenGL 状态管理的核心概念。一个上下文存储了与该 OpenGL 实例相关的所有状态信息，并代表了渲染命令在不使用 Framebuffer Object（帧缓冲对象）时将绘制到的默认帧缓冲区。可以将上下文理解为 OpenGL 的载体——当上下文被销毁时，OpenGL 也就随之销毁。

上下文是进程级别的概念，一个进程可以创建多个 OpenGL 上下文。每个上下文可以代表一个独立的可显示表面，例如应用程序中的窗口。

## 对象共享

每个上下文都有自己独立的一组 OpenGL Objects（OpenGL 对象），与其他上下文的对象相互隔离。上下文之间的对象可以共享，但必须显式设置。大多数 OpenGL 对象都支持共享，包括：

- Sync Objects（同步对象）
- GLSL Objects（GLSL 对象）

不支持共享的对象包括：

- Container Objects（容器对象）
- Query Objects（查询对象）

::: tip
对象共享必须在上下文创建时或新上下文创建任何对象之前显式设置。上下文之间也可以保持完全独立，不共享任何对象。
:::

## 上下文的当前性

任何 OpenGL 命令要生效，必须有一个上下文是 **current（当前的）**。所有 OpenGL 命令都影响当前上下文的状态。当前上下文是线程局部变量，因此一个进程可以有多个线程，每个线程都有自己的当前上下文。但是，一个上下文不能同时在多个线程中成为当前上下文。

## Context Types（上下文类型）

在 OpenGL 3.0 之前，所有版本都完全向后兼容。针对 OpenGL 1.1 编写的代码可以在 OpenGL 2.1 实现上正常运行。

OpenGL 3.0 引入了功能弃用的概念，许多 OpenGL 函数被声明为已弃用。OpenGL 3.1 移除了大部分在 3.0 中弃用的功能，包括 Fixed Function Pipeline（固定功能管线）。

为了向后兼容，OpenGL 最终形成了 **Core（核心）** 和 **Compatibility（兼容）** 两种上下文配置文件的区分。

### OpenGL 3.1 与 ARB_compatibility

OpenGL 3.1 发布时引入了 [ARB_compatibility](http://www.opengl.org/registry/specs/ARB/compatibility.txt) 扩展。该扩展的存在表明实现仍然通过原始入口点和枚举提供已弃用或移除的功能。

### OpenGL 3.2 与 Profiles（配置文件）

OpenGL 3.0 引入了新的上下文创建机制，允许用户请求特定版本的 OpenGL。在 3.2 版本中，OpenGL 正式分为两种 profiles（配置文件）：

- **Core Profile（核心配置文件）**：实现必须支持
- **Compatibility Profile（兼容配置文件）**：大多数实现会提供，但不保证

::: warning macOS 平台差异
macOS 10.7 引入 OpenGL 3.2+ 支持时，只提供核心配置文件，不支持兼容配置文件。用户只能在核心配置文件（3.2+）或传统 2.1 版本之间选择。无法在访问 2.1 之后功能的同时使用固定功能管线。
:::

### Forward Compatibility（向前兼容）

OpenGL 3.0 及以上版本的上下文可以设置 "forward compatibility"（向前兼容）标志，这会移除所有标记为已弃用的功能：

- **3.0**：移除所有弃用功能，模拟 3.1 体验
- **3.1**：移除剩余弃用功能（如宽线）
- **3.2+ 兼容配置文件**：无影响（兼容配置文件中没有弃用功能）
- **3.2+ 核心配置文件**：移除剩余弃用功能（宽线）

::: tip 建议
只有在需要 macOS 兼容性时才使用向前兼容标志，因为 macOS 创建核心配置文件上下文时必须设置该标志。
:::

### Debug Contexts（调试上下文）

上下文可以在调试模式下创建，这将使 Debug Output（调试输出）功能更有效地工作。

详见 Debug Output 相关文档。

### No Error Contexts（无错误上下文）

OpenGL 4.6 核心支持 | 扩展：[KHR_no_error](http://www.opengl.org/registry/specs/KHR/no_error.txt)

可以创建不报告 OpenGL Errors（OpenGL 错误）的上下文。当 `GL_CONTEXT_FLAG_NO_ERROR_BIT` 设置为 true 时：

- 上下文不会报告大多数错误
- 仍然可能报告 `GL_OUT_OF_MEMORY_ERROR`，但可能会延迟
- 实现不会检查错误，错误参数将导致未定义行为，甚至程序终止

::: warning
无错误上下文不能与 robustness（健壮性）或 debug（调试）标志同时使用。
:::

### Robust Access Context（健壮访问上下文）

通常，Buffer Object（缓冲对象）的越界内存访问会导致未定义结果，甚至可能导致程序崩溃，还可能读取其他应用程序写入的数据，带来安全隐患。

Robust access（健壮访问）模式下：

- 越界读取会返回明确定义的结果（通常为零）
- 此类访问不会导致程序终止
- 提供更好的进程隔离

## Context Information Queries（上下文信息查询）

### OpenGL Version Number（版本号）

OpenGL 3.0 及以上版本：

```c
glGetIntegerv(GL_MAJOR_VERSION, *);
glGetIntegerv(GL_MINOR_VERSION, *);
```

低于 3.0 的版本：

```c
glGetString(GL_VERSION);
```

返回的字符串以 `<主版本>.<次版本>` 开头，后跟厂商特定的构建号和其他信息。

示例：`"2.0.6914 WinXP SSE/SSE2/SSE3/3DNow!"`
- `2.0` 是 OpenGL 版本
- `6914` 是驱动构建号
- `WinXP` 是操作系统
- `SSE/SSE2/SSE3/3DNow!` 是驱动可使用的 CPU 特性

### Vendor String（厂商字符串）

```c
glGetString(GL_VENDOR);
```

常见值：`"ATI Technologies"`、`"NVIDIA Corporation"`、`"INTEL"` 等。

::: info
在 Windows 上，如果返回 `"Microsoft"`，说明正在使用 Windows 软件渲染器或 D3D 包装器，可能未安装显卡驱动。
:::

### Renderer Name（渲染器名称）

```c
glGetString(GL_RENDERER);
```

通常是 GPU 名称，例如 Mesa3d 可能返回 `"Gallium 0.4 on NVA8"`。

### Extension List（扩展列表）

逐个查询扩展：

```c
GLint num_extensions;
glGetIntegerv(GL_NUM_EXTENSIONS, &num_extensions);

for (int k = 0; k < num_extensions; k++) {
    const GLubyte* ext = glGetStringi(GL_EXTENSIONS, k);
}
```

#### Legacy Extension List（传统扩展列表） {#legacy-extension-list}

::: warning 已弃用
以下 API 已从 OpenGL 3.1 核心版本移除，不建议在新程序中使用。
:::

```c
glGetString(GL_EXTENSIONS);  // 返回空格分隔的扩展名列表
```

### Context Flags（上下文标志）

检测配置文件类型：

```c
glGetIntegerv(GL_CONTEXT_PROFILE_MASK, *);
```

返回值包含 `GL_CONTEXT_CORE_PROFILE_BIT` 或 `GL_CONTEXT_COMPATIBILITY_PROFILE_BIT`（两者互斥）。

检测其他上下文特性：

```c
glGetIntegerv(GL_CONTEXT_FLAGS, *);
```

可用的上下文标志：

| 标志 | 说明 |
|------|------|
| `GL_CONTEXT_FLAG_FORWARD_COMPATIBLE_BIT` | 向前兼容上下文 |
| `GL_CONTEXT_FLAG_DEBUG_BIT` | 调试上下文 |
| `GL_CONTEXT_FLAG_ROBUST_ACCESS_BIT` | 支持健壮内存访问 |
| `GL_CONTEXT_FLAG_NO_ERROR_BIT` | 不报告 OpenGL 错误 |

### Shading Language Version（着色语言版本）

查询 GLSL 主版本：

```c
glGetString(GL_SHADING_LANGUAGE_VERSION);
```

#### Supported GLSL Versions（支持的 GLSL 版本）

OpenGL 4.3+ 可查询所有支持的 GLSL 版本：

```c
GLint num_versions;
glGetIntegerv(GL_NUM_SHADING_LANGUAGE_VERSIONS, &num_versions);

for (int k = 0; k < num_versions; k++) {
    const GLubyte* version = glGetStringi(GL_SHADING_LANGUAGE_VERSION, k);
}
```

返回字符串格式与 GLSL `#version` 声明一致：

```
<number>
<number> <profile>
```

其中 `<profile>` 仅对有区分的 GLSL 版本存在。

::: info
- GLSL 1.00（通过 ARB_shading_language_100）返回空字符串 `""`
- 返回 `"100"` 表示 OpenGL ES 2.0 的 GLSL ES 1.00
- 返回 `"300 es"` 表示 GLSL ES 3.00
:::
