rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function masterEmail() {
      return signedIn() && request.auth.token.email == 'pica.fern@gmail.com';
    }

    function userDoc() {
      return get(/databases/$(database)/documents/utilizadores/$(request.auth.uid));
    }

    function hasUserDoc() {
      return signedIn() && exists(/databases/$(database)/documents/utilizadores/$(request.auth.uid));
    }

    function isActive() {
      return masterEmail() || (hasUserDoc() && userDoc().data.status == 'Ativo');
    }

    function role() {
      return masterEmail() ? 'Admin Master' : (hasUserDoc() ? userDoc().data.role : 'Pendente');
    }

    function canManage() {
      return isActive() && (role() in ['Admin Master', 'Admin']);
    }

    function canOperate() {
      return isActive() && (role() in ['Admin Master', 'Admin', 'Supervisor', 'Operador']);
    }

    function hasPermissionMap() {
      return hasUserDoc() && ('permissions' in userDoc().data);
    }

    function explicitPermission(page, action) {
      return hasPermissionMap()
        && (page in userDoc().data.permissions)
        && (action in userDoc().data.permissions[page])
        && userDoc().data.permissions[page][action] == true;
    }

    function roleDefaultPermission(action) {
      return role() in ['Admin Master', 'Admin']
        || (role() == 'Supervisor' && action in ['view', 'add', 'edit'])
        || (role() == 'Operador' && action in ['view', 'add']);
    }

    function canPage(page, action) {
      return isActive() && (
        role() in ['Admin Master', 'Admin']
        || explicitPermission(page, action)
        || (!hasPermissionMap() && roleDefaultPermission(action))
      );
    }

    function ownPresenceUpdate(document) {
      return signedIn()
        && (
          document == request.auth.uid
          || (resource.data.email == request.auth.token.email)
        )
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'online',
          'lastSeen',
          'currentPage',
          'sessionId',
          'userAgent',
          'updatedAt'
        ]);
    }

    match /meta/{document} {
      allow read: if signedIn();
      allow write: if canManage();
    }

    match /utilizadores/{document} {
      allow read: if signedIn();
      allow create: if (signedIn() && document == request.auth.uid) || masterEmail() || (isActive() && role() == 'Admin Master');
      allow update: if masterEmail() || (isActive() && role() == 'Admin Master') || ownPresenceUpdate(document);
      allow delete: if masterEmail() || (isActive() && role() == 'Admin Master');
    }

    match /clientes/{document} {
      allow read: if canPage('clientes', 'view');
      allow create: if canPage('clientes', 'add');
      allow update: if canPage('clientes', 'edit');
      allow delete: if canPage('clientes', 'delete');
    }

    match /fornecedores/{document} {
      allow read: if canPage('fornecedores', 'view');
      allow create: if canPage('fornecedores', 'add');
      allow update: if canPage('fornecedores', 'edit');
      allow delete: if canPage('fornecedores', 'delete');
    }


    match /viaturas/{document} {
      allow read: if canPage('rotas', 'view');
      allow create: if canPage('rotas', 'add');
      allow update: if canPage('rotas', 'edit');
      allow delete: if canPage('rotas', 'delete');
    }

    match /rotas/{document} {
      allow read: if canPage('rotas', 'view');
      allow create: if canPage('rotas', 'add');
      allow update: if canPage('rotas', 'edit');
      allow delete: if canPage('rotas', 'delete');
    }

    match /orcamentos/{document} {
      allow read: if canPage('orcamentos', 'view');
      allow create: if canPage('orcamentos', 'add');
      allow update: if canPage('orcamentos', 'edit');
      allow delete: if canPage('orcamentos', 'delete');
    }

    match /pedidos/{document} {
      allow read: if canPage('pedidos', 'view');
      allow create: if canPage('pedidos', 'add');
      allow update: if canPage('pedidos', 'edit');
      allow delete: if canPage('pedidos', 'delete');
    }

    match /agenda/{document} {
      allow read: if canPage('agenda', 'view');
      allow create: if canPage('agenda', 'add');
      allow update: if canPage('agenda', 'edit');
      allow delete: if canPage('agenda', 'delete');
    }

    match /stock/{document} {
      allow read: if canPage('stock', 'view');
      allow create: if canPage('stock', 'add');
      allow update: if canPage('stock', 'edit');
      allow delete: if canPage('stock', 'delete');
    }

    match /diretorioContactos/{document} {
      allow read: if canPage('contactos', 'view');
      allow create: if canPage('contactos', 'add');
      allow update: if canPage('contactos', 'edit');
      allow delete: if canPage('contactos', 'delete');
    }


    match /auditoria/{document} {
      allow read: if canManage();
      allow create, update: if canOperate();
      allow delete: if canManage();
    }

    match /backups/{document} {
      allow read, write: if canManage();
    }

    match /appState/{document} {
      allow read: if signedIn();
      allow write: if canManage();
    }
  }
}
