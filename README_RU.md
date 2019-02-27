# JRFJWT
**jrfjwt** это async/await пакет для работы с JWT. Функционал использует 
одну из СУБД **PostgreSQL** или **MongoDB**. Работа с токенами ведется в 
разрезе **Пользователь, Устройство**. 

## installation 
```js
$ nmp -i jrfjwt
```

## Содержимое токенов
  access и refresh токены содержат 
  - head `head: {alg, typ}`
  
  | Name | Type | Description |
  |---|---|---|
  |alg|string|Алгоритм шифрования|
  |typ|string|Тип токена|
  
  - payload `head: {userId, rolesId, devId, iss, exp}`
  
  | Name | Type | Description |
  |---|---|---|
  |userId|string|id пользователя|
  |rolesId|[array of string]|id ролей пользователя|
  |devId|string|id устройства пользователя|
  |iss|string|Идентификатор стороны, генерирующей токен|
  |exp|number|Время жизни токена|

## methods
#### constructor()
Просто создает объект `const jrfjwt = new JRFJWT();`

#### init(options)
Инициализация `let res = await jrfjwt.init(options)`
- **Options** - настройка `jrfjwt` состоит из `db` настройки базы данных 
и `token` настройки токена. Можно инициализировать без `options`, тогда будут 
применены настройки по умолчанию.

- **db**

| Name | Type | Default value | Description |
|---|---|---|---|
|type|string|`jrfjwt.dbType.MongoDB`|Какую СУБД использовать для хранения токенов. Для использования MongoDB `type: jrfjwt.dbType.MongoDB` или `type: 'mongoDB'`. Для использования PostgreSQL `type: jrfjwt.dbType.PostgreSQL` или `type: 'postgreSQL'`|
|server|string|'localhost'|Адрес СУБД|
|port|number|MongoDB `port: 27100`. PostgreSQL `port: 5432`|Порт СУБД|
|db|string|'jrfjwt'|Имя базы в СУБД|
|collection|string|'jwt'|Имя коллекции, только для MongoDB|
|user|string|''|Имя пользователя СУБД. Пользователь должен быть владельцем БД.|
|password|string|''|Пароль пользователя СУБД|

- **token**

| Name | Type | Default value | Description |
|---|---|---|---|
|alg|string|'HS512'|Алгоритм шифрования|
|typ|string|'JWT'|Тип токена|
|iss|string|''|Идентификатор стороны, генерирующей токен|
|accessExp|string|'10min'|Время жизни Access-токена. Доступны велечины `ms, sec, min, hour, day`|
|refreshExp|string|'10day'|Время жизни Refresh-токена. Доступны велечины `ms, sec, min, hour, day`|
|salt|string|'J*$#d84'|Соль|
|iterations|number|100|Количество итераций|
|hashLength|number|64|Длина хэша|

- **Пример**
```js
    const JRFJWT = require('jrfjwt');
    const jrfjwt = new JRFJWT();
    
    let res = await jrfjwt.init({
        db: {
            type: jrfjwt.dbType.PostgreSQL,
            server: 'localhost',
            port: 5432,
            db: 'jrfjwt_test',
            user: 'jrfjwttest',
            password: '12345678'
        },
        token: {
            alg: 'HS512',
            typ: 'JWT',
            iss: '',
            accessExp: '10min',
            refreshExp: '10day',
            salt: 'J*$#d73',
            iterations: 100,
            hashLength: 64
        }
    });
```

- **Ответ -** Если не удалось подключиться к БД, будет вызвано исключение `'not init jrfjwt'`.

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty array]|Инициализация прошла удачно|

#### addNewUser(user)
Добавить нового пользователя в базу токенов.

- **user**

| Name | Type | optional | Description |
|---|---|---|---|
|userId|string| |id пользователя|
|rolesId|[array of strings]| true |Массив id ролей пользователя|

- **Пример**
```js
    let res = await jrfjwt.addNewUser({
        userId: 'morty',
        rolesId: ['yong', 'foreveryong']
    });
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[id]|Пользователь добавлен. Если MongoDB то `output[0]` содержит внутренний id добавленого документа `5c739e5cff97723bbc43bd9b`. Если PostgreSQL то `output[0]` содержит userId добавленного пользователя `morty`|
|false|'not add'|[empty]|Пользователя не удалось добавить.|

#### addNewUsers(users)
Добавить новых пользователей в базу токенов.

- **users** - массив содержащий пользователей

- **user**

| Name | Type | optional | Description |
|---|---|---|---|
|userId|string| |id пользователя|
|rolesId|[array of strings]| true |Массив id ролей пользователя|

- **Пример**
```js
    let res = await jrfjwt.addNewUsers([
        {
            userId: 'morty',
            rolesId: ['yong', 'foreveryong']
        },
        {
            userId: 'rick',
            rolesId: ['space', 'superspace']
        }
    ]);
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[array of res add user]|`res.okay` всегда `true`. Массив `res.output` содержить результаты добавления по каждому пользователю|

- **res add user**

| Name | Type | Description |
|---|---|---|
|user|obj|добавляемый пользователь|
|add|boolean|`true` - пользователь добавлен, `false` - не удалось добавить пользователя|
|description|string|`userId` - если пользователь добавлен, `'not add'` - если не удалось добавить пользователя|

#### getUsers(id)
Получить пользователей, если id не передан, возвращаются все пользователи.

- **id**

| Name | Type | optional | Description |
|---|---|---|---|
|id|string|true| id - пользователя|

- **Пример**
```js
    let res = await jrfjwt.getUsers();
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[array of users]|`output[0]` содержит пользователя(ей)|

- **user**

| Name | Type | Description |
|---|---|---|
|userId|string|id - пользователя|
|rolesId|[array of string]|массив id - ролей пользователя|
|tokens|[array of token]|массив действующих токенов пользователя|
|tokensOld|[array of tokenOld]|массив устаревших токенов пользователя|

- **token**

| Name | Type | Description |
|---|---|---|
|devId|string|id - устройства пользователя|
|access|string|access токен|
|refresh|string|refresh токен|

```js
[ { userId: 'morty',
       rolesId: [ 'yong', 'foreveryong' ],
       tokens:
        [ { devId: 'blaster',
            access: 'accessToken1',
            refresh: 'refreshToken1' },
          { devId: 'laser',
            access: 'accessTokenLaser',
            refresh: 'refreshTokenLaser' },
          { devId: 'loser',
            access: 'accessTokenLoser',
            refresh: 'refreshTokenLoser' } ],
       tokensOld:
        [ { devId: 'blaster',
            access: 'accessToken1Old',
            refresh: 'refreshToken1Old' },
          { devId: 'laser',
            access: 'accessTokenLaserOld',
            refresh: 'refreshTokenLaserOld' },
          { devId: 'Cheat',
            access: 'accessTokenCheaatOld',
            refresh: 'refreshTokenCheatOld' } ] } ]
```

#### updateRoles(userId, rolesId)
Обновить роли пользователя

| Name | Type | optional | Description |
|---|---|---|---|
|userId|string| | id - пользователя|
|rolesId|[array of strings]|true|массив id ролей пользователя, если массив не задан, то у пользователя будут удалены все роли|

- **Пример**

```js
    let res = await jrfjwt.getUsers('morty', ['user', 'guest']);
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty]|Роли обновлены|
|false|'not update'|[empty]|Роли не обновлены| 

#### delUsers(id)
Удалить пользователя, если id не передан, удаляются все пользователи.

- **id**

| Name | Type | optional | Description |
|---|---|---|---|
|id|string|true| id - пользователя|

- **Пример**
```js
    let res = await jrfjwt.delUsers();
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|'deleted: X'|[array of users]|Удалось удалить, где X - количество удаленных пользователей. `res.output` если MongoDB, то содержит количество удаленных пользователей, если PosgreSQL, то содержит объекты удаленных пользователей|
|false|''|[empty]|Не удалось удалить|

#### createTokens(userId)
Создать новый токен для пользователя

| Name | Type | Description |
|---|---|---|
|userId|string|id - пользователя|

- **Пример**

```js
    let res = await jrfjwt.createTokens('morty');
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[token]|`output[0]` содержит созданный токен|
|false|'not create'|[empty]|Не удалось создать новый токен|

- **token**

| Name | Type | Description |
|---|---|---|
|devId|string|сгенерированный id устройства|
|access|string|access токен|
|refresh|string|refresh токен|

#### updateTokens(userId, devId)
Обновить(переиздать) токен пользователя для устройства.

| Name | Type | Description |
|---|---|---|
|userId|string|id - пользователя|
|devId|string|id - устройства|

- **Пример**

```js
    let res = await jrfjwt.updateTokens('morty', 'DKO32LS');
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[token]|`output[0]` содержит обновленный токен|
|false|'not update'|[empty]|Не удалось обновить токен|

- **token**

| Name | Type | Description |
|---|---|---|
|devId|string|id устройства|
|access|string|access токен|
|refresh|string|refresh токен|

#### delTokens(userId, devId)
Удалить токен устройства пользователя.

| Name | Type | Description |
|---|---|---|
|userId|string|id - пользователя|
|devId|string|id - устройства|

- **Пример**

```js
    let res = await jrfjwt.delTokens('morty', 'DKO32LS');
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty]|Токен удален|
|false|'not del'|[empty]|Не удалось удалить токен|

#### delAllTokens(userId)
Удалить все токены пользователя.

| Name | Type | Description |
|---|---|---|
|userId|string|id - пользователя|

- **Пример**

```js
    let res = await jrfjwt.delAllTokens('morty');
```

- **Ответ**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty]|Токены удалены|
|false|'not del'|[empty]|Не удалось удалить токены|

#### isValid(access, refresh, rolesRules, usersRules)
Проверка токена на валидность. Проверка прав доступа пользователя.  

| Name | Type | optional | Description |
|---|---|---|---|
|access|string| |access токен пользователя|
|refresh|string| |refresh токен пользователя|
|rolesRules|obj|true|Правила проверки доступа по роли|
|usersRules|obj|true|Правила проверки доступа по пользователю|

- **rolesRules** 

| Name | Type | optional | Description |
|---|---|---|---|
|exclude|[array of strings]| |массив id - ролей которым запрещен доступ|
|include|[array of strings]| |массив id - ролей которым разрешен доступ|
|defaultAccess|boolean| |доступ по умолчанию, если роль не найдена ни в одном из списков. `true` - доступ разрешен, `false` - доступ запрещен|

- **usersRules** 

| Name | Type | optional | Description |
|---|---|---|---|
|exclude|[array of strings]| |массив id - пользователей которым запрещен доступ|
|include|[array of strings]| |массив id - пользователей которым разрешен доступ|
|defaultAccess|boolean| |доступ по умолчанию, если пользователей не найден ни в одном из списков. `true` - доступ разрешен, `false` - доступ запрещен|

- **Пример**

```js
const rolesRules = {
            exclude: ['superuser'],
            include: [],
            defaultAccess: false
        };
let res = await token.isValid({access, refresh, rolesRules});
```

- **Логика**
  - Токены декодируются, если декодировать не удалось, 
  то возврат `res.description = 'invalid'`
  - Проверяется подпись access токена, если подпись не валидна, 
  то возврат `res.description = 'access signature invalid'`
  - Проверяется подпись refresh токена, если подпись не валидна, 
  то возврат `res.description = 'refresh signature invalid'`
  - Поиск пользователя по `userId` в БД, если пользователь не найден, 
  то возврат `res.description = 'not found user'`
  - Поиск `access` и `refresh` токенов у пользователя по `devId`. 
  
    В один момент времени у пользователя по `devId` может существовать 
  только один действующий токен (`token: {devId, access, refresh}`) и один 
  устаревший/предыдущий токен (`tokenOld: {devId, access, refresh}`).
  
    Если `access` и `refresh` токены не найдены в `token` и `tokenOld`, 
    то возврат `res.description = 'tokens not found'`, удаляются токены  
    по `userId, devId`
    
  - Если `access` и `refresh` токены были найдены в `tokenOld`, 
  то `tokenOld` удаляется, а `access` и `refresh` принимают значение 
  из `token` (`token: {devId, access, refresh}` `tokenOld: {}`).
  - Проверяется время жизни `refresh` токена, если время жизни истекло 
  то возврат `res.description = 'refresh token not live'`, удаляются токены  
      по `userId, devId`
  - Проверяется время жизни `access` токена, если время жизни истекло, то
  у пользователя создается новый `token: {devId, access, refresh}`, 
  удаляется `tokenOld: {}`, текущие `access` и `refresh` токены помещаются 
  в `tokenOld: {devId, access, refresh}`. Новый токен передается в ответе 
  `res.tokensNew`. Если при обновлении токена произошла ошибка, то возврат
   `res.description = 'server error, repeat pleas'`
  - Если был передан `usersRules` то проверяется разрешен ли доступ
  пользователю. Если `userId` найден в `include`, то `res.access = true`,
  если `userId` найден в `exclude`, то `res.access = false`, если `userId` 
  не найден в `include` и в `exclude`, то `res.access = defaultAccess`. 
  Если `res.access = false`, то возврат `res.description = 'no rights'`
  - Если был передан `rolesRules` то проверяется разрешен ли доступ
    пользователю по ролям. Если одна из ролей пользователя `rolesId` 
    найдена в `include`, то `res.access = true`, если одна из ролей 
    пользователя `rolesId` найдена в `exclude`, то `res.access = false`, 
    если ни одна из ролей пользователя `rolesId` не найдена в `include` 
    и в `exclude`, то `res.access = defaultAccess`. 
    Если `res.access = false`, то возврат `res.description = 'no rights'`
  - Возврат ответа `res`
    ```js
    res = {
        okay: true,
        description: '',
        isValid: true,
        access: true,
        tokensNew: {devId, access, refresh}
    };
    ```
- **Ответ** 

| res.okay | res.description | res.isValid | res.access | res.tokensNew | Description |
|---|---|---|---|---|---|
|false|'invalid'|false|false|undefined|Не верный токен, не удалось декодировать|
|false|'access signature invalid'|false|false|undefined|Не валидная подпись access токена|
|false|'refresh signature invalid'|false|false|undefined|Не валидная подпись refresh токена|
|false|'not found user'|false|false|undefined|Не найден пользователь, токены удаляются по `userId, devId`|
|false|'tokens not found'|false|false|undefined|Токены `access` и `refresh` не найдены в `tokens` и `tokensOld` по `userId, devId`, токены удаляются по `userId, devId`|
|false|'refresh token not live'|false|false|undefined|Время жизни `refresh` токена истекло, токены удаляются по `userId, devId`|
|false|'server error, repeat pleas'|false|false|undefined|Время жизни `access` токена истекло. При попытке обновить токен произошла ошибка на сервере.|
|true|'no rights'|true|false|undefined|Токен валиден, но нет доступа по пользователю или по роли|
|true|''|true|true|undefined|Токен валиден, есть доступ|
|true|''|true|true|`{devId, access, refresh}`|Токен валиден, есть доступ. Токен обновлен.|
