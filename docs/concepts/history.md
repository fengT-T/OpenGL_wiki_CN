# OpenGL 发展历史

## 概述

OpenGL 最初是作为 Iris GL 的开放且可复现的替代方案创建的，Iris GL 是 Silicon Graphics 工作站上的专有图形 API。尽管 OpenGL 在某些方面与 Iris GL 相似，但缺乏正式规范和一致性测试使得 Iris GL 不适合更广泛的采用。

Mark Segal 和 Kurt Akeley 编写了 OpenGL 1.0 规范，试图形式化定义一个有用的图形 API，使跨平台非 SGI 第三方实现和支持成为可行。1.0 版本 API 的一个显著遗漏是纹理对象——Iris GL 对所有类型的对象（包括材质、光源、纹理和纹理环境）都有定义和绑定阶段，而 OpenGL 为了增量状态更改的理念放弃了这些对象，唯一的例外是没有独立定义阶段的纹理对象（`glBindTexture`）成为 API 的关键部分。

OpenGL 经历了多次修订，主要是将扩展逐渐纳入核心 API 的增量添加。例如，OpenGL 1.1 将 `glBindTexture` 扩展纳入核心 API。

::: tip 里程碑
- **OpenGL 2.0**：引入 OpenGL 着色语言（GLSL），一种类 C 语言，可编程管线的变换和片段着色阶段
- **OpenGL 3.0**：引入弃用概念，标记某些功能将在后续版本中移除
- **OpenGL 3.1**：移除大多数被弃用的功能
- **OpenGL 3.2**：创建核心和兼容性 OpenGL 上下文的概念
:::

## 版本变更摘要

### OpenGL 4.6 (2017)

| 新增功能 | 核心扩展 |
|---------|---------|
| 可使用 SPIR-V 语言定义着色器 | ARB_gl_spirv, ARB_spirv_extensions |
| 顶点着色器可获取绘制 ID 和基础顶点/实例值 | ARB_shader_draw_parameters |
| 多绘制间接渲染命令可从缓冲区获取绘制次数 | ARB_indirect_parameters |
| 统计和变换反馈溢出查询 | ARB_pipeline_statistics_query, ARB_transform_feedback_overflow_query |
| 各向异性过滤 | ARB_texture_filter_anisotropic |
| 钳位多边形偏移 | ARB_polygon_offset_clamp |
| 可创建不报告任何错误的 OpenGL 上下文 | KHR_no_error |
| 原子计数器更多操作 | ARB_shader_atomic_counter_ops |
| 避免不必要的发散着色器调用 | ARB_shader_group_vote |

### OpenGL 4.5 (2014)

| 新增功能 | 核心扩展 |
|---------|---------|
| 附加裁剪控制模式，配置裁剪空间到窗口空间的映射 | ARB_clip_control |
| 新增 GLSL gl_CullDistance 着色器输出 | ARB_cull_distance |
| 与 OpenGL ES 3.1 兼容 | ARB_ES3_1_compatibility |
| glBeginConditionalRender 新模式 | ARB_conditional_render_inverted |
| 控制底层实现计算导数的空间粒度 | ARB_derivative_control |
| 无需绑定对象即可修改和查询对象状态 | ARB_direct_state_access |
| 获取纹理图像子区域的新函数 | ARB_get_texture_sub_image |
| 升级健壮性功能以符合 ES 3.1 标准 | KHR_robustness |
| GLSL 内置函数查询纹理样本数 | ARB_shader_texture_image_samples |
| 放宽渲染到当前绑定纹理的限制 | ARB_texture_barrier |

### OpenGL 4.4 (2013)

| 新增功能 | 核心扩展 |
|---------|---------|
| 缓冲区对象的不可变存储，包括映射时使用缓冲区的能力 | ARB_buffer_storage |
| 直接清除纹理图像 | ARB_clear_texture |
| 布局限定符多项增强 | ARB_enhanced_layouts |
| 单次调用绑定对象数组到连续绑定目标范围 | ARB_multi_bind |
| 查询对象值可写入缓冲区对象 | ARB_query_buffer_object |
| 特殊钳位模式，在各维度上将纹理大小翻倍 | ARB_texture_mirror_clamp_to_edge |
| 模板专用图像格式可用于纹理 | ARB_texture_stencil8 |
| 顶点属性的打包 3 分量 11F/11F/10F 格式 | ARB_vertex_type_10f_11f_11f_rev |

### OpenGL 4.3 (2012)

| 新增功能 | 核心扩展 |
|---------|---------|
| 调试消息 | KHR_debug |
| GLSL 多维数组 | ARB_arrays_of_arrays |
| 清除缓冲区对象到特定值 | ARB_clear_buffer_object |
| 任意计算着色器 | ARB_compute_shader |
| 任意图像复制 | ARB_copy_image |
| 与 OpenGL ES 3.0 兼容 | ARB_ES3_compatibility |
| 在着色器中指定 uniform 位置 | ARB_explicit_uniform_location |
| 片段着色器可访问层和视口索引 | ARB_fragment_layer_viewport |
| 渲染到无附件的帧缓冲区对象 | ARB_framebuffer_no_attachments |
| 图像格式的通用化查询 | ARB_internalformat_query2 |
| 纹理、缓冲区对象和帧缓冲区失效 | ARB_invalidate_subdata |
| 单次绘制命令发出多个间接渲染命令 | ARB_multi_draw_indirect |
| 获取程序对象接口信息的改进 API | ARB_program_interface_query |
| 从 GLSL 获取图像大小 | ARB_shader_image_size |
| 着色器读写缓冲区对象 | ARB_shader_storage_buffer_object |
| 从深度/模板纹理访问模板值 | ARB_stencil_texturing |
| 缓冲区纹理可绑定到缓冲区对象范围 | ARB_texture_buffer_range |
| GLSL 可检测采样器或图像的可用 mipmap 金字塔 | ARB_texture_query_levels |
| 多重采样纹理的不可变存储 | ARB_texture_storage_multisample |
| 创建引用现有纹理存储的新纹理 | ARB_texture_view |
| 顶点格式与缓冲区对象分离 | ARB_vertex_attrib_binding |

### OpenGL 4.2 (2011)

| 新增功能 | 核心扩展 |
|---------|---------|
| 从着色器原子增减和获取缓冲区对象内存位置 | ARB_shader_atomic_counters |
| 着色器读写图像 | ARB_shader_image_load_store |
| 纹理对象不可变存储 | ARB_texture_storage |
| 变换反馈操作的实例化渲染 | ARB_transform_feedback_instanced |
| 在 GLSL 中直接设置 UBO 和采样器绑定点 | ARB_shading_language_420pack |
| 实例化渲染可指定起始实例值 | ARB_base_instance |
| 检测特定图像格式和纹理类型的最大样本数 | ARB_internalformat_query |
| 压缩纹理数据传输时的子矩形选择 | ARB_compressed_texture_pixel_storage |
| 着色器中从 32 位无符号整数解包 16 位浮点数 | ARB_shading_language_packing |
| 查询缓冲区对象映射操作返回的指针对齐 | ARB_map_buffer_alignment |
| 显式定义片段着色器如何修改深度值 | ARB_conservative_depth |
| BPTC 压缩图像格式 | ARB_texture_compression_BPTC |

### OpenGL 4.1 (2010)

| 新增功能 | 核心扩展 |
|---------|---------|
| 查询和加载程序对象的二进制块 | ARB_get_program_binary |
| 可单独将程序绑定到可编程阶段 | ARB_separate_shader_objects |
| 从 OpenGL ES 2.0 拉取缺失功能 | ARB_ES2_compatibility |
| 文档化多个浮点操作的精度要求 | ARB_shader_precision |
| 64 位浮点分量顶点属性 | ARB_vertex_attrib_64bit |
| 同一渲染表面的多个视口 | ARB_viewport_array |

### OpenGL 4.0 (2010)

| 新增功能 | 核心扩展 |
|---------|---------|
| 着色语言 4.00 | ARB_texture_query_lod, ARB_gpu_shader5 等 |
| 间接绘制（无多重绘制） | ARB_draw_indirect |
| 请求最小片段输入数 | ARB_sample_shading |
| 曲面细分（带着色器阶段） | ARB_tessellation_shader |
| 缓冲区纹理格式 RGB32F, RGB32I, RGB32UI | ARB_texture_buffer_object_rgb32 |
| 立方体贴图数组纹理 | ARB_texture_cube_map_array |
| 变换反馈对象和多反馈流输出 | ARB_transform_feedback2, ARB_transform_feedback3 |
| 每个颜色输出的独立混合方程 | ARB_draw_buffers_blend |

### OpenGL 3.3 (2010)

| 新增功能 | 核心扩展 |
|---------|---------|
| 着色语言 3.30 | ARB_shader_bit_encoding |
| 双源混合 | ARB_blend_func_extended |
| 着色器定义属性和片段着色器输出位置 | ARB_explicit_attrib_location |
| 简单布尔遮挡查询 | ARB_occlusion_query2 |
| 采样器对象 | ARB_sampler_objects |
| 无符号 10.10.10.2 颜色图像格式 | ARB_texture_rgb10_a2ui |
| 纹理搅动 | ARB_texture_swizzle |
| 计时器查询 | ARB_timer_query |
| 实例化数组 | ARB_instanced_arrays |
| 顶点属性 2.10.10.10 | ARB_vertex_type_2_10_10_10_rev |

### OpenGL 3.2 (2009)

- 核心和兼容性配置文件
- 着色语言 1.50

| 新增功能 | 核心扩展 |
|---------|---------|
| D3D 兼容颜色顶点分量排序 | ARB_vertex_array_bgra |
| 允许修改基础顶点索引的绘制命令 | ARB_draw_elements_base_vertex |
| 着色器片段坐标约定控制 | ARB_fragment_coord_conventions |
| 激发顶点控制 | ARB_provoking_vertex |
| 无缝立方体贴图过滤 | ARB_seamless_cube_map |
| 多重采样纹理和特定样本位置的纹理采样器 | ARB_texture_multisample |
| 片段深度钳位 | ARB_depth_clamp |
| 栅栏同步对象 | ARB_sync |
| 几何着色器及输入/输出接口块 | ARB_geometry_shader4 |

### OpenGL 3.1 (2009)

- 移除 OpenGL 3.0 中弃用的所有功能（宽线除外）
- 着色语言 1.40
- SNORM 纹理分量格式

| 新增功能 | 核心扩展 |
|---------|---------|
| 统一缓冲区对象 | ARB_uniform_buffer_object |
| 实例化渲染，顶点着色器可访问每实例计数器 | ARB_draw_instanced |
| 缓冲区对象间数据复制 | ARB_copy_buffer |
| 图元重启 | NV_primitive_restart |
| 缓冲区纹理 | ARB_texture_buffer_object |
| 矩形纹理 | ARB_texture_rectangle |

### OpenGL 3.0 (2008)

- 新上下文创建机制
- 完全和前向兼容上下文
- 配置文件
| 将缓冲区子范围映射到客户端空间
- 单通道和双通道（R 和 RG）纹理和渲染缓冲区内部格式

| 新增功能 | 核心扩展/来源 |
|---------|---------|
| 帧缓冲区对象及 blitting、多重采样渲染缓冲区对象、打包深度/模板图像格式 | ARB_framebuffer_object |
| 顶点数组对象 | ARB_vertex_array_object |
| 条件渲染 | NV_conditional_render |
| 浮点颜色和深度内部格式 | 多个扩展 |
| 半浮点顶点数组和像素数据格式 | NV_half_float, EXT_half_float_pixel |
| 整数图像格式 | EXT_texture_integer |
| 数组纹理 | EXT_texture_array |
| 每颜色附件混合启用和颜色写入掩码 | EXT_draw_buffers2 |
| 红绿纹理压缩 | EXT_texture_compression_rgtc |
| 变换反馈 | ARB_transform_feedback |
| sRGB 帧缓冲区模式 | EXT_framebuffer_sRGB |

#### 弃用模型

OpenGL 3.0 规范将许多功能标记为弃用，这些功能在后续版本中被移除，包括：

- 应用程序生成的对象名称
- 颜色索引模式
- 着色语言 1.10 和 1.20
- Begin/End 图元指定
- 固定功能顶点处理
- 客户端顶点数组
- 四边形和多边形图元
- 固定功能片段处理
- Alpha 测试
- 累积缓冲区
- 显示列表

### OpenGL 2.1 (2006)

| 新增功能 | 来源 |
|---------|------|
| 像素缓冲区对象 | ARB_pixel_buffer_object |
| sRGB 纹理 | EXT_texture_sRGB |

着色语言 1.20：GLSL 中的非方阵

### OpenGL 2.0 (2004)

| 新增功能 | 来源 |
|---------|------|
| 着色器对象 | ARB_shader_objects（大幅修改） |
| 着色器程序 | ARB_vertex_shader, ARB_fragment_shader（大幅修改） |
| 着色语言 1.10 | ARB_shading_language_100（大幅修改） |
| 多渲染目标 | ARB_draw_buffers |
| 非二次幂纹理 | ARB_texture_non_power_of_two |
| 点精灵 | ARB_point_sprite |
| 分离模板 | ATI_separate_stencil, EXT_stencil_two_side |

### OpenGL 1.5 (2003)

| 新增功能 | 来源 |
|---------|------|
| 缓冲区对象 | ARB_vertex_buffer_object |
| 遮挡查询 | ARB_occlusion_query |
| 阴影函数 | EXT_shadow_funcs |

### OpenGL 1.4 (2002)

| 新增功能 | 来源 |
|---------|------|
| 自动 mipmap 生成 | SGIS_generate_mipmap |
| 混合平方 | NV_blend_square |
| 深度纹理和阴影 | ARB_depth_texture, ARB_shadow |
| 雾坐标 | EXT_fog_coord |
| 多重绘制数组 | EXT_multi_draw_arrays |
| 点参数 | ARB_point_parameters |
| 辅助颜色 | EXT_secondary_color |
| 分离混合函数 | EXT_blend_func_separate |
| 模板回绕 | EXT_stencil_wrap |
| 纹理 crossbar 环境模式 | ARB_texture_env_crossbar |
| 纹理 LOD 偏移 | EXT_texture_lod_bias |
| 纹理镜像重复 | ARB_texture_mirrored_repeat |
| 窗口光栅位置 | ARB_window_pos |

### OpenGL 1.3 (2001)

| 新增功能 | 来源 |
|---------|------|
| 压缩纹理 | ARB_texture_compression |
| 立方体贴图纹理 | ARB_texture_cube_map |
| 多重采样 | ARB_multisample |
| 多重纹理 | ARB_multitexture |
| 纹理添加环境模式 | ARB_texture_env_add |
| 纹理组合环境模式 | ARB_texture_env_combine |
| 纹理 dot3 环境模式 | ARB_texture_env_dot3 |
| 纹理边界钳位 | ARB_texture_border_clamp |
| 转置矩阵 | ARB_transpose_matrix |

### OpenGL 1.2.1 (1998)

定义了 ARB 扩展概念。ARB 扩展不要求符合性 OpenGL 实现必须支持，但预期广泛可用；它们定义了可能在规范未来版本中成为必需功能集的功能。

### OpenGL 1.2 (1998)

| 新增功能 | 来源 |
|---------|------|
| 3D 纹理 | EXT_texture3D |
| BGRA 像素格式 | EXT_bgra |
| 打包像素格式 | EXT_packed_pixels |
| 法线重新缩放 | EXT_rescale_normal |
| 分离镜面颜色 | EXT_separate_specular_color |
| 纹理坐标边界钳位 | SGIS_texture_edge_clamp |
| 纹理 LOD 控制 | SGIS_texture_lod |
| 顶点数组绘制元素范围 | EXT_draw_range_elements |

### OpenGL 1.1 (1997)

| 新增功能 | 来源 |
|---------|------|
| 顶点数组 | EXT_vertex_array |
| 多边形偏移 | EXT_polygon_offset |
| 逻辑操作 | EXT_blend_logic_op |
| 内部纹理格式 | EXT_texture |
| GL_REPLACE 纹理环境 | EXT_texture |
| 纹理代理 | EXT_texture |
| 复制纹理和子纹理 | EXT_copy_texture, EXT_subtexture |
| 纹理对象 | EXT_texture_object |

### OpenGL 1.0 (1992)

首次发布。
