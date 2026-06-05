# 用户管理模块设计

## 背景

项目已经引入 SQLite 用于动态配置持久化。下一步需要把 `LOGIN_FORM` 登录用户从启动参数迁移到数据库持久化，同时保留启动参数创建首个管理员的能力。权限模块暂不实现，第一版所有数据库用户都视为管理员。

## 目标

- 引入通用应用数据库 `kafka-ui.db`，用于承载动态配置和用户数据。
- 启动时自动迁移旧动态配置数据，包括旧 SQLite `dynamic_config.db` 和旧 YAML `dynamic_config.yaml`。
- 当数据库没有用户时，用 `SPRING_SECURITY_USER_NAME` 和 `SPRING_SECURITY_USER_PASSWORD` 创建首个启用管理员。
- `LOGIN_FORM` 登录优先使用数据库用户认证。
- 提供用户管理 API 和简单前端页面，支持用户列表、创建、启用/禁用、重置密码、删除。
- 保留现有 RSA-OAEP 登录密码加密传输机制。

## 非目标

- 不实现角色、权限、菜单授权或 RBAC。
- 不支持多认证源用户合并；数据库用户只服务 `auth.type=LOGIN_FORM`。
- 不返回或展示密码 hash。
- 不提供用户自助注册、找回密码、多因素认证。

## 配置与数据库

新增通用 SQLite 配置项：

- `kafka.ui.sqlite.path`：默认 `/etc/kafkaui/kafka-ui.db`。

兼容旧配置项：

- `dynamic.config.sqlite.path`：仅作为旧动态配置 SQLite 的迁移来源保留兼容，不再作为新写入目标。
- `dynamic.config.path`：继续作为旧 YAML 动态配置迁移来源。

数据库表：

- `schema_version(version integer primary key)`：记录当前应用数据库 schema 版本。
- `dynamic_config(id integer primary key check (id = 1), yaml text not null, updated_at text not null)`：保留现有动态配置 YAML 文本存储形态。
- `users(id integer primary key autoincrement, username text not null unique, password_hash text not null, enabled integer not null, created_at text not null, updated_at text not null)`：存储登录用户。

迁移规则：

1. 启动时创建或打开 `kafka-ui.db`。
2. 执行内置 schema 迁移，确保三张表存在。
3. 如果新库 `dynamic_config` 为空：
   - 优先从旧 `dynamic_config.db` 导入 `dynamic_config.yaml` 文本。
   - 如果旧 SQLite 不存在或为空，再从旧 `dynamic_config.yaml` 文件导入。
   - 如果都不存在，跳过迁移，不阻止启动。
4. 后续动态配置写入只写入 `kafka-ui.db`。

## 用户认证

`auth.type=LOGIN_FORM` 时启用数据库用户认证：

1. 登录页加载 `/auth/public-key`。
2. 浏览器使用 WebCrypto `RSA-OAEP` 加密密码。
3. 表单提交时隐藏字段 `password` 承载密文，明文密码输入框不带 `name`。
4. 后端认证管理器解密密文。
5. 使用数据库中的 `password_hash` 校验密码。
6. 用户不存在、被禁用或密码错误时认证失败。

非 `LOGIN_FORM` 认证模式不创建数据库认证管理器，也不改变 OAuth2、LDAP、DISABLED 的安全配置行为。

## 初始管理员 Bootstrap

启动条件：`auth.type=LOGIN_FORM`。

规则：

- 如果 `users` 表为空，读取 `SPRING_SECURITY_USER_NAME` 和 `SPRING_SECURITY_USER_PASSWORD` 创建首个启用用户。
- 密码用 Spring Security `DelegatingPasswordEncoder` 生成 hash 后入库。
- 如果 `users` 表为空但缺少用户名或密码，启动失败并给出明确错误。
- 如果 `users` 表已有用户，启动参数不覆盖数据库用户。
- 用户名去除首尾空白后存储；空用户名非法。

## 用户管理 API

所有 API 仅在当前用户已通过 `LOGIN_FORM` 登录后可访问。

建议路径：`/api/users`。

接口：

- `GET /api/users`：返回用户列表，不包含 `password_hash`。
- `POST /api/users`：创建用户，请求包含 `username`、`password`、`enabled`。
- `PATCH /api/users/{id}/enabled`：启用或禁用用户。
- `POST /api/users/{id}/password`：重置用户密码。
- `DELETE /api/users/{id}`：删除用户。

约束：

- 用户名唯一。
- 密码不能为空。
- 禁止禁用最后一个启用用户。
- 禁止删除最后一个启用用户。
- 删除不存在用户返回 404。
- 创建重复用户名返回 400。

## 前端页面

新增简单用户管理页面，导航入口命名为 `Users` / `用户管理`。

功能：

- 展示用户列表：用户名、状态、创建时间、更新时间、操作。
- 创建用户：用户名、密码、启用状态。
- 启用/禁用用户。
- 重置密码。
- 删除用户。
- 对最后一个启用用户的禁用/删除失败展示后端错误提示。

页面不展示角色和权限字段，避免给用户造成权限已实现的误解。

## 组件划分

后端新增或调整：

- `ApplicationSqliteOperations`：统一负责打开通用 SQLite、schema 迁移和旧数据导入。
- `DynamicConfigOperations`：改为依赖通用 SQLite 存储动态配置。
- `UserRepository`：封装用户表 CRUD。
- `DatabaseUserDetailsService`：为 Spring Security 提供数据库用户查询。
- `UserBootstrapService`：启动时创建首个管理员。
- `UsersController`：提供用户管理 API。
- `LoginEncryptionService` 和 `EncryptedPasswordAuthenticationManager`：保留现有 RSA 登录加密流程，认证数据源切换到数据库。

前端新增或调整：

- API hook：封装用户列表、创建、启用/禁用、重置密码、删除。
- 用户管理页面组件。
- 导航入口与 i18n 文案。
- 用户管理页面测试。

## 错误处理

- SQLite 文件路径为目录、父目录不可写、数据库迁移失败时，抛出明确启动异常。
- Bootstrap 缺少初始管理员参数时，启动失败并提示配置 `SPRING_SECURITY_USER_NAME` 和 `SPRING_SECURITY_USER_PASSWORD`。
- 用户管理 API 返回结构化错误，前端展示后端错误信息或通用失败提示。
- 登录失败继续沿用现有 `/auth?error` 行为。

## 测试计划

后端测试：

- 新库不存在时自动创建 `kafka-ui.db` 和表。
- 旧 `dynamic_config.db` 自动导入到新 `kafka-ui.db`。
- 旧 `dynamic_config.yaml` 自动导入到新 `kafka-ui.db`。
- 新库已有动态配置时不覆盖。
- `users` 为空时按启动参数创建首个用户。
- `users` 非空时不覆盖已有用户。
- 缺少初始管理员参数时启动失败。
- 数据库用户登录成功、密码错误失败、禁用用户失败。
- 用户 API CRUD、重复用户名、最后启用用户保护。
- RSA-OAEP 加密密码仍可被后端解密。

前端测试：

- 导航显示用户管理入口。
- 用户列表渲染。
- 创建用户提交正确请求并刷新列表。
- 启用/禁用、重置密码、删除操作触发正确 API。
- 后端保护错误能展示给用户。

## 已确认决策

本设计已固定以下决策：

- 使用通用 `kafka-ui.db`。
- 初始管理员继续兼容 `SPRING_SECURITY_USER_NAME/PASSWORD`。
- 第一版同时实现后端和简单前端。
- 权限模块后置。
