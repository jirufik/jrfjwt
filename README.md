# JRFJWT
**jrfjwt** is an async/await package for working with JWT. The functional 
uses one of **PostgreSQL** or **MongoDB** DBMS. Work with tokens is 
conducted in the context of **User, Device**.

## installation 
```js
$ nmp -i jrfjwt
```

## Token content
  access and refresh tokens contain 
  - head `head: {alg, typ}`
  
  | Name | Type | Description |
  |---|---|---|
  |alg|string|Encryption algorithm|
  |typ|string|Token type|
  
  - payload `head: {userId, rolesId, devId, iss, exp}`
  
  | Name | Type | Description |
  |---|---|---|
  |userId|string|user id|
  |rolesId|[array of string]|user role id|
  |devId|string|user device id|
  |iss|string|ID of the token-generating side|
  |exp|number|Token lifetime|
  
## methods
#### constructor()
Just creates an object `const jrfjwt = new JRFJWT();`

#### init(options)
Initialization `let res = await jrfjwt.init(options)`
- **Options** - the `jrfjwt` setting consists of the `db` database setting 
and `token` token setting. You can initialize without `options`, then the 
default settings will be applied.

- **db**

| Name | Type | Default value | Description |
|---|---|---|---|
|type|string|`jrfjwt.dbType.MongoDB`|What DBMS to use for storing tokens. To use MongoDB `type: jrfjwt.dbType.MongoDB` or `type: 'mongoDB'`. To use PostgreSQL `type: jrfjwt.dbType.PostgreSQL` or `type: 'postgreSQL'`|
|server|string|'localhost'|DBMS Address|
|port|number|MongoDB `port: 27100`. PostgreSQL `port: 5432`|DBMS Port|
|db|string|'jrfjwt'|Database name in DBMS|
|collection|string|'jwt'|Collection name, for MongoDB only|
|user|string|''|DBMS username. The user must be the owner of the database.|
|password|string|''|DBMS User Password|

- **token**

| Name | Type | Default value | Description |
|---|---|---|---|
|alg|string|'HS512'|Encryption algorithm|
|typ|string|'JWT'|Token type|
|iss|string|''|ID of the token-generating side|
|accessExp|string|'10min'|Access Token lifetime. Available are `ms, sec, min, hour, day`|
|refreshExp|string|'10day'|Refresh Token lifetime. Available are `ms, sec, min, hour, day`|
|salt|string|'J*$#d84'|Salt|
|iterations|number|100|Number of iterations|
|hashLength|number|64|Hash length|

- **Example**
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

- **Response -** If it was not possible to connect to the database, a 
`'not init jrfjwt'` exception will be thrown.

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty array]|Initialization went well|

#### addNewUser(user)
Add a new user to the database of tokens.

- **user**

| Name | Type | optional | Description |
|---|---|---|---|
|userId|string| |User id|
|rolesId|[array of strings]| true |Array id user roles|

- **Example**
```js
    let res = await jrfjwt.addNewUser({
        userId: 'morty',
        rolesId: ['yong', 'foreveryong']
    });
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[id]|User has been added. If MongoDB then `output [0]` contains the internal id of the added document `5c739e5cff97723bbc43bd9b`. If PostgreSQL then `output [0]` contains the userId of the added user `morty`|
|false|'not add'|[empty]|User failed to add.|

#### addNewUsers(users)
Add new users to the database of tokens.

- **users** - array containing users

- **user**

| Name | Type | optional | Description |
|---|---|---|---|
|userId|string| |User id|
|rolesId|[array of strings]| true |Array id user roles|

- **Example**
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

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[array of res add user]|`res.okay` always `true`. The array `res.output` contains the results of the addition for each user|

- **res add user**

| Name | Type | Description |
|---|---|---|
|user|obj|add user|
|add|boolean|`true` - user added, `false` - failed to add user|
|description|string|`userId` - if a user is added, `'not add'` - if unable to add a user|

#### getUsers(id)
Get users, if id is not passed, all users are returned.

- **id**

| Name | Type | optional | Description |
|---|---|---|---|
|id|string|true| User id|

- **Example**
```js
    let res = await jrfjwt.getUsers();
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[array of users]|`output [0]` contains user (s)|

- **user**

| Name | Type | Description |
|---|---|---|
|userId|string|user id|
|rolesId|[array of string]|array of user roles id|
|tokens|[array of token]|array of active user tokens|
|tokensOld|[array of tokenOld]|array of obsolete user tokens|

- **token**

| Name | Type | Description |
|---|---|---|
|devId|string|user device id|
|access|string|access token|
|refresh|string|refresh token|

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
Update user roles

| Name | Type | optional | Description |
|---|---|---|---|
|userId|string| |user id|
|rolesId|[array of strings]|true|array of user role id; if the array is not set, then all user roles will be deleted from the user|

- **Example**

```js
    let res = await jrfjwt.getUsers('morty', ['user', 'guest']);
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty]|Roles updated|
|false|'not update'|[empty]|Roles not updated|

#### delUsers(id)
Delete user, if id is not passed, all users are deleted.

- **id**

| Name | Type | optional | Description |
|---|---|---|---|
|id|string|true|user id|

- **Example**
```js
    let res = await jrfjwt.delUsers();
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|'deleted: X'|[array of users]|Managed to delete user (s). Where X is the number of deleted users. `res.output` if MongoDB, then contains the number of remote users, if PosgreSQL, it contains objects of remote users|
|false|''|[empty]|Could not delete|

#### createTokens(userId)
Create a new token for user

| Name | Type | Description |
|---|---|---|
|userId|string|user id|

- **Example**

```js
    let res = await jrfjwt.createTokens('morty');
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[token]|`output[0]` contains the created token|
|false|'not create'|[empty]|Failed to create a new token.|

- **token**

| Name | Type | Description |
|---|---|---|
|devId|string|generated device id|
|access|string|access token|
|refresh|string|refresh token|

#### updateTokens(userId, devId)
Update (reissue) user token for device.

| Name | Type | Description |
|---|---|---|
|userId|string|user id|
|devId|string|device id|

- **Example**

```js
    let res = await jrfjwt.updateTokens('morty', 'DKO32LS');
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[token]|`output[0]` contains the updated token|
|false|'not update'|[empty]|Failed to update token|

- **token**

| Name | Type | Description |
|---|---|---|
|devId|string|user id|
|access|string|access token|
|refresh|string|refresh token|

#### delTokens(userId, devId)
Delete user device token.

| Name | Type | Description |
|---|---|---|
|userId|string|user id|
|devId|string|device id|

- **Example**

```js
    let res = await jrfjwt.delTokens('morty', 'DKO32LS');
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty]|Token removed|
|false|'not del'|[empty]|Could not delete token|

#### delAllTokens(userId)
Delete all user tokens.

| Name | Type | Description |
|---|---|---|
|userId|string|user id|

- **Example**

```js
    let res = await jrfjwt.delAllTokens('morty');
```

- **Response**

| res.okay | res.description | res.output | Description |
|---|---|---|---|
|true|''|[empty]|Tokens removed|
|false|'not del'|[empty]|Could not remove tokens|

#### isValid(access, refresh, rolesRules, usersRules)
Check token for validity. Check user access rights.  

| Name | Type | optional | Description |
|---|---|---|---|
|access|string| |access user token|
|refresh|string| |refresh user token|
|rolesRules|obj|true|Role Access Validation Rules|
|usersRules|obj|true|User Access Verification Rules|

- **rolesRules** 

| Name | Type | optional | Description |
|---|---|---|---|
|exclude|[array of strings]| |array of id roles that are denied access|
|include|[array of strings]| |array id roles allowed access|
|defaultAccess|boolean| |default access if the role is not found in any of the lists. `true` - access is allowed, `false` - access is denied|

- **usersRules** 

| Name | Type | optional | Description |
|---|---|---|---|
|exclude|[array of strings]| |array id users who are denied access|
|include|[array of strings]| |Array id of users who are allowed access|
|defaultAccess|boolean| |default access if users are not found in any of the lists. `true` - access is allowed, `false` - access is denied|

- **Example**

```js
const rolesRules = {
            exclude: ['superuser'],
            include: [],
            defaultAccess: false
        };
let res = await token.isValid({access, refresh, rolesRules});
```

- **Logic**
  - Tokens are decoded; if decode failed, then return 
  `res.description = 'invalid'`
  - The access token's signature is checked, if the signature is not 
  valid, then return `res.description = 'access signature invalid'`
  - The refresh token's signature is checked, if the signature is not 
  valid, then the return is `res.description = 'refresh signature invalid'`
  - Search user `userId` in the database, if the user is not found, then 
  return`res.description = 'not found user'`
  - Search `access` and` refresh` tokens from user by `devId`. 
  
    At one time, a user by `devId` can have only one valid token 
    (`token: {devId, access, refresh}`) and one obsolete/previous 
    token (`tokenOld: {devId, access, refresh}`).
  
    If the `access` and` refresh` tokens are not found in the 
    `token` and `tokenOld`, then return `res.description = 
    'tokens not found'`, the tokens by `userId, devId` are removed
    
  - If the `access` and `refresh` tokens were found in `tokenOld`, then
  `tokenOld` is deleted, and `access` and `refresh` take on the value 
  from `token` (`token: {devId, access, refresh}` `tokenOld : {}`).
  - It checks the lifetime of the `refresh` token, if the lifetime has 
  expired, then return `res.description = 'refresh token not live'`, 
  tokens are deleted by `userId, devId`
  - The access time of the `access` token is checked, if the lifetime 
  has expired, the user creates a new `token: {devId, access, refresh}`, 
  removes `tokenOld: {}`, the current `access` and `refresh` tokens are 
  placed in `tokenOld: {devId, access, refresh}`. A new token is passed 
  in the response `res.tokensNew`. If an error occurred while updating 
  the token, then return `res.description = 'server error, repeat pleas'`
  - If `usersRules` was passed, then it is checked whether access is 
  allowed to the user. If `userId` is found in `include`, then 
  `res.access = true`, if `userId` is found in `exclude`, then 
  `res.access = false`, if `userId` is not found in `include` and in 
  `exclude`, then `res.access = defaultAccess`. If `res.access = false`, 
  then return `res.description = 'no rights'`
  - If `rolesRules` was passed, then it is checked whether access to the 
  user is allowed by roles. If one of the roles of the user `rolesId` is 
  found in `include`, then `res.access = true`, if one of the user roles 
  of the `rolesId` is found in `exclude`, then `res.access = false`, if 
  none of user roles `rolesId` not found in `include` and in `exclude`, 
  then `res.access = defaultAccess`. If `res.access = false`, then return
  `res.description = 'no rights'`
  - Return response `res`
    ```js
    res = {
        okay: true,
        description: '',
        isValid: true,
        access: true,
        tokensNew: {devId, access, refresh}
    };
    ```
- **Response** 

| res.okay | res.description | res.isValid | res.access | res.tokensNew | Description |
|---|---|---|---|---|---|
|false|'invalid'|false|false|undefined|Invalid token failed to decode|
|false|'access signature invalid'|false|false|undefined|Not valid token access signature|
|false|'refresh signature invalid'|false|false|undefined|Not valid refresh token signature|
|false|'not found user'|false|false|undefined|User is not found, tokens are deleted by `userId, devId`|
|false|'tokens not found'|false|false|undefined|The `access` and `refresh` tokens are not found in `tokens` and `tokensOld` by `userId, devId`, tokens are deleted by `userId, devId`|
|false|'refresh token not live'|false|false|undefined|The `refresh` token has expired, the tokens are deleted by `userId, devId`|
|false|'server error, repeat pleas'|false|false|undefined|The token `access` lifetime has expired. An error occurred on the server while trying to update the token.|
|true|'no rights'|true|false|undefined|Token is valid, but there is no access by user or by role.|
|true|''|true|true|undefined|Token valid, there is access|
|true|''|true|true|`{devId, access, refresh}`|Token valid, there is access. Token updated.|

 
