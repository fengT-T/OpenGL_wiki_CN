# 获取上下文信息

OpenGL 上下文包含大量可查询的信息，包括版本号、厂商、渲染器、扩展列表等。

## OpenGL 版本号

### OpenGL 3.0+ 方法

```c
glGetIntegerv(GL_MAJOR_VERSION, *);
glGetIntegerv(GL_MINOR_VERSION, *);
```

### 传统方法

```c
glGetString(GL_VERSION);
```

返回字符串以 `<主版本>.<次版本>` 开头，后跟厂商特定的构建号和额外信息。

**示例**：`"2.0.6914 WinXP SSE/SSE2/SSE3/3DNow!"`
- `2.0`：OpenGL 版本
- `6914`：驱动构建号
- `WinXP`：操作系统
- `SSE/SSE2/SSE3/3DNow!`：驱动可使用的 CPU 特性

有时 `glGetString(GL_VERSION)` 还会返回总线类型（AGP、PCI、PCIEx）。

## 厂商字符串

```c
glGetString(GL_VENDOR);
```

用于标识实现的制造者，可能返回：
- `"ATI Technologies"`（AMD）
- `"NVIDIA Corporation"`
- `"INTEL"`
- `"Microsoft"`（软件渲染器或 D3D 包装器）

::: tip 提示
在 Windows 上，如果返回 `"Microsoft"`，说明正在使用 Windows 软件渲染器或 Direct3D 包装器，通常意味着未安装显卡驱动。
:::

## 渲染器名称

```c
glGetString(GL_RENDERER);
```

通常是 GPU 名称。例如 Mesa3d 可能返回 `"Gallium 0.4 on NVA8"`。

## 扩展列表

### 现代方法（OpenGL 3.0+）

```c
GLint numExtensions;
glGetIntegerv(GL_NUM_EXTENSIONS, &numExtensions);

for (int k = 0; k < numExtensions; k++) {
    const char* ext = glGetStringi(GL_EXTENSIONS, k);
    // 处理每个扩展
}
```

### 传统方法

::: warning 已废弃
此方法已从 OpenGL 3.1 核心版本移除，仅建议在 OpenGL 3.0 或更早版本使用。
:::

```c
glGetString(GL_EXTENSIONS);
```

返回空格分隔的扩展名称列表。

## 着色语言版本

### 主版本查询

```c
glGetString(GL_SHADING_LANGUAGE_VERSION);
```

版本字符串格式与上下文版本类似，但次版本号始终为两位数。

### 支持的 GLSL 版本列表（OpenGL 4.3+）

```c
GLint numVersions;
glGetIntegerv(GL_NUM_SHADING_LANGUAGE_VERSIONS, &numVersions);

for (int k = 0; k < numVersions; k++) {
    const char* version = glGetStringi(GL_SHADING_LANGUAGE_VERSION, k);
    // 处理每个版本
}
```

版本字符串格式遵循 GLSL 的 `#version` 声明：

```
<number>
<number> <profile>
```

**示例**：
- `"330 core"` - GLSL 3.30 core
- `"300 es"` - GLSL ES 3.00
- `"100"` - GLSL ES 1.00（注意：不是 GLSL 1.00）

::: info 注意
- GLSL 1.10 才引入 `#version` 声明，支持 GLSL 1.00（通过 `ARB_shading_language_100`）的实现返回空字符串
- OpenGL ES 的 GLSL 版本通过 `"es"` profile 标识
:::

## 快速参考

| 信息类型 | 函数 | 参数 |
|----------|------|------|
| 主版本号 | `glGetIntegerv` | `GL_MAJOR_VERSION` |
| 次版本号 | `glGetIntegerv` | `GL_MINOR_VERSION` |
| 版本字符串 | `glGetString` | `GL_VERSION` |
| 厂商 | `glGetString` | `GL_VENDOR` |
| 渲染器 | `glGetString` | `GL_RENDERER` |
| 扩展数量 | `glGetIntegerv` | `GL_NUM_EXTENSIONS` |
| 单个扩展 | `glGetStringi` | `GL_EXTENSIONS, index` |
| GLSL 版本 | `glGetString` | `GL_SHADING_LANGUAGE_VERSION` |
| 配置文件掩码 | `glGetIntegerv` | `GL_CONTEXT_PROFILE_MASK` |
| 上下文标志 | `glGetIntegerv` | `GL_CONTEXT_FLAGS` |
