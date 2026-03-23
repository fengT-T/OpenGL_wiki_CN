# 平台特定问题 (Platform Specific)

本节介绍各操作系统平台上 OpenGL 开发可能遇到的特定问题。

## Windows 平台

**Platform specifics: Windows**

Windows 平台的 OpenGL 开发有其独特性：

- WGL 扩展加载机制
- 上下文创建和像素格式选择
- 多窗口和多上下文管理

### MinGW

使用 MinGW 编译 OpenGL 程序时需要注意：

- 链接库配置
- 扩展加载方式
- 与 MSVC 的兼容性

## Linux 平台

**Platform specifics: Linux**

Linux 平台使用 GLX 进行 OpenGL 管理：

- GLX 扩展和上下文创建
- X11 与 Wayland 的差异
- 驱动程序配置（NVIDIA/AMD/Intel）

::: tip 常用工具
- `glxinfo`：查看 OpenGL 信息
- `glxgears`：简单性能测试
- `vblank_mode` 环境变量：控制垂直同步
:::

## Mac OS X 平台

**Platform specifics: Mac OS X**

macOS 使用 CGL 或 NSOpenGL 进行 OpenGL 管理：

- Core Profile 与 Legacy Profile
- OpenGL 版本限制（macOS 限制较严格）
- Metal 与 OpenGL 的过渡

::: warning 注意
Apple 已宣布弃用 OpenGL，建议新项目考虑 Metal 或 MoltenVK。
:::