# 立方体贴图纹理 (Cubemap Texture)

立方体贴图是一种特殊纹理，每个 Mipmap 级别由六张正方形二维图像组成，代表立方体的六个面。纹理坐标是一个三维方向向量，表示从立方体中心指向采样点的方向。

**核心版本**：1.3  
**扩展**：`ARB_texture_cube_map`

## 创建

立方体贴图使用 `GL_TEXTURE_CUBE_MAP` 类型。每个 Mipmap 级别有 6 个面，每个面尺寸相同且必须为正方形。

### 不可变存储

```c
glBindTexture(GL_TEXTURE_CUBE_MAP, texture);
glTexStorage2D(GL_TEXTURE_CUBE_MAP, levels, GL_RGBA8, size, size);
```

### 可变存储

需要为每个面单独调用 `glTexImage2D`：

```c
glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, level, internalformat, width, height, 0, format, type, data);
glTexImage2D(GL_TEXTURE_CUBE_MAP_NEGATIVE_X, level, internalformat, width, height, 0, format, type, data);
glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_Y, level, internalformat, width, height, 0, format, type, data);
glTexImage2D(GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, level, internalformat, width, height, 0, format, type, data);
glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_Z, level, internalformat, width, height, 0, format, type, data);
glTexImage2D(GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, level, internalformat, width, height, 0, format, type, data);
```

六个面目标：
- `GL_TEXTURE_CUBE_MAP_POSITIVE_X`
- `GL_TEXTURE_CUBE_MAP_NEGATIVE_X`
- `GL_TEXTURE_CUBE_MAP_POSITIVE_Y`
- `GL_TEXTURE_CUBE_MAP_NEGATIVE_Y`
- `GL_TEXTURE_CUBE_MAP_POSITIVE_Z`
- `GL_TEXTURE_CUBE_MAP_NEGATIVE_Z`

## 数据上传与方向

### 使用 glTexSubImage3D (GL 4.5+)

面索引顺序：

| 层号 | 立方体面 |
|-----|---------|
| 0 | `GL_TEXTURE_CUBE_MAP_POSITIVE_X` |
| 1 | `GL_TEXTURE_CUBE_MAP_NEGATIVE_X` |
| 2 | `GL_TEXTURE_CUBE_MAP_POSITIVE_Y` |
| 3 | `GL_TEXTURE_CUBE_MAP_NEGATIVE_Y` |
| 4 | `GL_TEXTURE_CUBE_MAP_POSITIVE_Z` |
| 5 | `GL_TEXTURE_CUBE_MAP_NEGATIVE_Z` |

### 使用 glTexSubImage2D

使用对应的 `GL_TEXTURE_CUBE_MAP_*` 面目标。

### 面的方向

立方体贴图使用左手坐标系。若 X 为前方，Y 为上方，则 Z 指向左侧。

以 +Z 为前方、+Y 为上方、+X 为右方为例：

| 面 | U 方向 | V 方向 |
|----|-------|-------|
| +Z (前方) | 右 | 下 |
| +X (右方) | 后 | 下 |
| -Z (后方) | 左 | 下 |
| -X (左方) | 前 | 下 |
| +Y (上方) | 右 | 前 |
| -Y (下方) | 右 | 后 |

::: info
V 坐标在所有情况下都是翻转的，因为 OpenGL 使用左下角为原点的纹理坐标系。
:::

## 纹理访问

GLSL 采样器类型：
- `samplerCube`：标准采样
- `samplerCubeShadow`：阴影比较采样

纹理坐标为三维方向向量，从立方体中心指向采样点。向量无需归一化。

默认情况下，过滤不会跨越立方体面边界，可能产生可见接缝。

## 分层渲染

立方体贴图可以绑定到帧缓冲对象进行分层渲染，面的层号顺序与上表相同。

## 无缝立方体贴图

**核心版本**：3.2  
**扩展**：`ARB_seamless_cube_map`

默认过滤规则下，立方体贴图的过滤不会跨越面边界，导致面之间出现接缝。启用无缝过滤：

```c
glEnable(GL_TEXTURE_CUBE_MAP_SEAMLESS);
```

## 立方体数组纹理

**核心版本**：4.0  
**扩展**：`ARB_texture_cube_map_array`

立方体数组使用 `GL_TEXTURE_CUBE_MAP_ARRAY` 类型。

### 存储

使用 `glTexStorage3D` 或 `glTexImage3D`，`depth` 参数为**层面数**（layer-faces），必须为 6 的倍数。

实际立方体数量 = `depth / 6`

### 示例

上传第二个立方体的 +Z 面（层号 = 1 × 6 + 4 = 10）：

```c
glTexSubImage3D(GL_TEXTURE_CUBE_MAP_ARRAY, 0, 0, 0, 10, width, height, 1, format, type, data);
```

### GLSL 采样器

- `samplerCubeArray`：标准采样
- `samplerCubeArrayShadow`：阴影比较采样

纹理坐标为四维：(x, y, z) 为方向向量，w 为层索引（实际层号，非层面号）。
