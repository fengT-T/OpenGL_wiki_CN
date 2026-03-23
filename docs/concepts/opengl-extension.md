# OpenGL 扩展（OpenGL Extension）

**OpenGL 扩展**是 OpenGL 实现提供核心功能之外的新功能或增强功能的机制。使用扩展是 OpenGL 开发的标准实践，不应被视为需要避免的操作。

## 扩展注册表

[OpenGL 扩展注册表](http://www.opengl.org/registry/)由 ARB 维护，包含：

- 所有已知 OpenGL 扩展的技术规范
- 创建新扩展的指南
- 示例 C/C++ 头文件（函数入口点和枚举定义）

注册表包含超过 300 个扩展，许多已过时，部分已整合到 OpenGL 核心中。

## 扩展内容

每个扩展至少包含：

- 一个或多个枚举标记（Enum Token）
- 或一个或多个函数

扩展名称、函数名和枚举名都以扩展前缀结尾。

**示例**：`GL_ARB_multitexture` 扩展
- 函数：`glActiveTextureARB`
- 枚举：`GL_TEXTURE0_ARB`

### 核心扩展例外

核心扩展（Core Extensions）使用 `GL_ARB_` 前缀，但函数和枚举不添加 `ARB` 后缀，以匹配核心 API 风格。

## 扩展支持检查

所有扩展都针对特定 OpenGL 版本编写。可以在运行时检查扩展是否支持：

```c
GLint numExtensions;
glGetIntegerv(GL_NUM_EXTENSIONS, &numExtensions);

for (int k = 0; k < numExtensions; k++) {
    const char* ext = glGetStringi(GL_EXTENSIONS, k);
    if (strcmp(ext, "GL_ARB_example") == 0) {
        // 扩展支持
    }
}
```

## 扩展加载

扩展函数必须在运行时动态加载。可使用自动工具简化此过程，如 GLEW、GLAD 等。

## 扩展类型

### 按前缀分类

| 前缀 | 类型 | 说明 |
|------|------|------|
| `GL_ARB_` | ARB 批准 | 多厂商，最可能进入核心 |
| `GL_EXT_` | 通用扩展 | 多厂商可实现 |
| `GL_NV_` | NVIDIA 私有 | 仅 NVIDIA 硬件支持 |
| `GL_ATI_` | AMD 私有 | 仅 AMD 硬件支持 |
| `GL_INTEL_` | Intel 私有 | 仅 Intel 硬件支持 |
| `GL_APPLE_` | Apple 私有 | 仅 Apple 平台 |

### 平台相关前缀

| 前缀 | 平台 |
|------|------|
| `WGL_*` | Windows |
| `GLX_*` | X-Window（Linux/Unix） |
| `AGL_*` | Apple |

::: warning 实验性扩展
`NVX`、`SGIX`、`SGIS` 等前缀表示实验性扩展，不应在生产环境使用，可能被移除。
:::

## 扩展类型详解

### ARB 扩展

经过 ARB 批准的多厂商扩展，特点：
- 进入核心版本的可能性最高
- 进入核心时改动最小

### EXT 扩展

通用扩展，任何实现都可以实现：
- 不保证所有厂商都实现
- 信号：可能在其他实现中可用

### 厂商私有扩展

特定厂商硬件独有功能：
- `GL_NV_*` - NVIDIA
- `GL_AMD_*` / `GL_ATI_*` - AMD
- `GL_INTEL_*` - Intel

### 核心扩展

OpenGL 3.0 引入，用于在低版本中暴露高版本的核心功能：
- 前缀为 `GL_ARB_`
- 函数和枚举名不带后缀
- 行为与对应核心功能完全一致

### 无处不在的扩展

某些扩展已被广泛实现，虽非核心但可视为 OpenGL 基础设施的一部分。

## 常用扩展

### 通用扩展

- `WGL_ARB_extensions_string` - Windows 扩展查询
- `WGL_ARB_pixel_format` - 像素格式
- `WGL_ARB_framebuffer_sRGB` - sRGB 帧缓冲
- `GL_EXT_texture_filter_anisotropic` - 各向异性过滤
- `GL_EXT_texture_compression_s3tc` - S3TC 纹理压缩
- `GL_ARB_debug_output` - 调试输出（需调试上下文）
- `GL_KHR_debug` - 调试功能（取代 ARB_debug_output）

### OpenGL 3.3 目标常用扩展

- `GL_ARB_separate_shader_objects` - 独立着色器
- `GL_ARB_texture_storage` - 不可变纹理存储
- `GL_ARB_vertex_attrib_binding` - 顶点属性绑定
- `GL_ARB_viewport_array` - 视口数组

### OpenGL 2.1 目标常用扩展

- `GL_ARB_vertex_array_object` - VAO
- `GL_ARB_framebuffer_object` - FBO
- `GL_ARB_map_buffer_range` - 缓冲区映射
- `GL_ARB_sync` - 同步对象

## 扩展规范结构

### 前言部分

| 章节 | 说明 |
|------|------|
| Name | 扩展名称 |
| Name String | 扩展字符串 |
| Dependencies | 依赖的 OpenGL 版本和其他扩展 |
| Overview | 功能概述（描述性文本） |

### 规范部分

| 章节 | 说明 |
|------|------|
| New Procedures and Functions | 新增函数列表 |
| New Tokens | 新增枚举及其值 |
| Additions to Chapter X | 对规范的修改 |
| Errors | 新增错误说明 |
| Dependencies | 依赖交互说明 |

### 结尾部分

| 章节 | 说明 |
|------|------|
| Issues | 设计问答，帮助理解扩展 |
| Revision History | 修订历史 |

## 相关链接

- [OpenGL Extension Registry](http://www.opengl.org/registry/)
- [加载 OpenGL 函数](./../getting-started/loading-opengl-functions.md)
