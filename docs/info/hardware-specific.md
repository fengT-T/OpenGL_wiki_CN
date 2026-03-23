# 硬件特定问题 (Hardware Specific)

本节介绍不同显卡厂商驱动程序的特定问题和差异。

## ATI/AMD 显卡

**Hardware specifics: ATI**

AMD 显卡常见问题：

- 驱动程序特性支持差异
- 性能优化建议
- 已知 Bug 和解决方案

## Intel 集成显卡

**Hardware specifics: Intel**

Intel 集成显卡特点：

- 显存共享系统内存
- 驱动更新通过 Windows Update
- 某些高级功能支持有限

::: info 性能考虑
Intel 集成显卡适合轻量级应用，复杂场景需注意性能预算。
:::

## NVIDIA 显卡

**Hardware specifics: NVidia**

NVIDIA 显卡特点：

- 驱动程序稳定性较好
- 扩展支持广泛
- Nsight 调试工具集成

## GLSL 厂商特定特性

### AMD 特定特性

**GLSL : ATI/AMD specific features**

AMD 驱动对 GLSL 的特定处理：

- 扩展行为差异
- 着色器编译器优化
- 已知兼容性问题

### NVIDIA 特定特性

**GLSL : nVidia specific features**

NVIDIA 驱动对 GLSL 的特定处理：

- 着色器编译器行为
- 扩展支持情况
- 性能提示

::: warning 跨厂商兼容性
编写跨厂商兼容的 GLSL 代码时，应避免依赖厂商特定行为，使用标准 GLSL 功能，并在目标硬件上充分测试。
:::