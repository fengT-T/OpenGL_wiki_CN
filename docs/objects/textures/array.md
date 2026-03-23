# 数组纹理 (Array Texture)

数组纹理是一种特殊的纹理类型，每个 Mipmap 级别包含一组相同尺寸的图像。数组纹理可以作为纹理图集 (Texture Atlas) 的替代方案，避免了图集的一些问题。

**核心版本**：3.0  
**扩展**：`EXT_texture_array`

## 概述

数组纹理的优势：
- 减少纹理切换开销
- 避免纹理图集的边界伪影问题
- 每层可独立寻址

::: warning
数组纹理不能用于固定管线，必须通过着色器访问。
:::

## 术语

每个 Mipmap 级别是一系列图像，每张图像称为一个**层 (layer)**。所有 Mipmap 级别的层数相同。

## 创建与管理

### 1D 数组纹理

绑定到 `GL_TEXTURE_1D_ARRAY`，使用"2D"图像函数，`height` 参数设置层数：

```c
glBindTexture(GL_TEXTURE_1D_ARRAY, texture);
glTexStorage2D(GL_TEXTURE_1D_ARRAY, levels, GL_RGBA8, width, layerCount);
```

每行像素数据对应一个 1D 层。

### 2D 数组纹理

绑定到 `GL_TEXTURE_2D_ARRAY`，使用"3D"图像函数，`depth` 参数设置层数：

```c
glBindTexture(GL_TEXTURE_2D_ARRAY, texture);
glTexStorage3D(GL_TEXTURE_2D_ARRAY, levels, GL_RGBA8, width, height, layerCount);
```

每个 2D 像素序列对应一个 2D 层。

### 示例代码

```c
GLuint texture = 0;
GLsizei width = 2, height = 2, layerCount = 2, mipLevelCount = 1;

GLubyte texels[32] = {
    // 第一层
    0,   0,   0,   255,
    255, 0,   0,   255,
    0,   255, 0,   255,
    0,   0,   255, 255,
    // 第二层
    255, 255, 255, 255,
    255, 255, 0,   255,
    0,   255, 255, 255,
    255, 0,   255, 255,
};

glGenTextures(1, &texture);
glBindTexture(GL_TEXTURE_2D_ARRAY, texture);

glTexStorage3D(GL_TEXTURE_2D_ARRAY, mipLevelCount, GL_RGBA8, width, height, layerCount);
glTexSubImage3D(GL_TEXTURE_2D_ARRAY, 0, 0, 0, 0, width, height, layerCount, GL_RGBA, GL_UNSIGNED_BYTE, texels);

glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
```

### Mipmap 注意事项

与 3D 纹理不同，数组纹理的所有 Mipmap 级别使用**相同**的层数：

```c
glTexImage3D(GL_TEXTURE_2D_ARRAY, 0, format, width, height, num_layers, ...);
glTexImage3D(GL_TEXTURE_2D_ARRAY, 1, format, width/2, height/2, num_layers, ...);
glTexImage3D(GL_TEXTURE_2D_ARRAY, 2, format, width/4, height/4, num_layers, ...);
```

## 着色器访问

GLSL 采样器类型：
- `sampler1DArray`：1D 数组纹理
- `sampler2DArray`：2D 数组纹理

纹理坐标比普通纹理多一个维度：
- `sampler1DArray` 使用 2D 坐标 (s, layer)
- `sampler2DArray` 使用 3D 坐标 (s, t, layer)

最后一个坐标是层索引。对于浮点坐标，层索引的计算公式：

```
actual_layer = max(0, min(d - 1, floor(layer + 0.5)))
```

其中 `d` 是纹理层数，`layer` 是纹理坐标中的层值。

### 示例

采样第 2 层的坐标 (0.4, 0.6)：

```glsl
vec4 color = texture(texArray, vec3(0.4, 0.6, 2.0));
```

## 立方体数组纹理

**核心版本**：4.0  
**扩展**：`ARB_texture_cube_map_array`

详见 [立方体贴图纹理](./cubemap.md#立方体数组纹理)。

## 限制

- 纹理尺寸受 `GL_MAX_TEXTURE_SIZE` 限制
- 层数受 `GL_MAX_ARRAY_TEXTURE_LAYERS` 限制
  - OpenGL 3.0：至少 256
  - OpenGL 4.5：至少 2048
