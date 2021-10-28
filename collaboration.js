
let { Model, View, startSession } = Croquet;

const urlParams = new URLSearchParams(window.location.search);
let userName = urlParams.get('user') ? urlParams.get('user') : "Teacher";
let sessionName = urlParams.get('room') ? urlParams.get('room') : "abacus1";
let type = urlParams.get('type') ? urlParams.get('type') : 't';
let abacusLevel = urlParams.get('level') ? urlParams.get('level') : 'Senior';
document.getElementById("roomName").textContent = sessionName;

if (type !== 't') {
    document.getElementById("shareBtn").style.display = "none";
}
if (abacusLevel === "Toddler") {
    var body = document.getElementsByTagName("BODY")[0];
    body.classList.add("toddler");
    if (type === 's') {
        body.classList.add("student");
    }
}
class CollaborationModel extends Model {
    init() {
        this.actions = [];
        this.users = {};
        this.stats = {};
        this.subscribe(this.sessionId,"draw_abacus", this.onDrawAbacus);
        this.subscribe(this.sessionId,"reset_abacus", this.onResetAbacus);
        this.subscribe(this.sessionId,"pull_request", this.onPull);
        this.subscribe(this.sessionId,"view-exit", this.onRemove);
        this.subscribe(this.sessionId, "toggle_role", this.onToggle);
    }
    onDrawAbacus(data) {
        this.actions.push(data.selectedElement);
        this.publish(this.sessionId,"update", data);
    }
    onResetAbacus() {
        this.actions = [];
        this.publish(this.sessionId,"reset");
    }
    onPull(data) {
        this.users[data.id] = data.name;
        if (this.stats[data.name] !== 1)
            this.stats[data.name] = 0;
        if (data.type === 't')
            this.stats[data.name] = 2;
        this.publish(this.sessionId,"new_user", { actions: this.actions, viewId: data.id, users: this.users, stats: this.stats});
    }
    onRemove(id) {
        delete this.users[id];
        this.publish(this.sessionId,"remove_user", { actions: this.actions, viewId: id, users: this.users, stats: this.stats});
    }
    onToggle(user) {
        console.log(user);
        if (this.stats[user] !== 2)
            this.stats[user] = 1 - this.stats[user];
        console.log(this.stats[user]);
        this.publish(this.sessionId,"toggle_user", { actions: this.actions, users: this.users, stats: this.stats});
    }
}

CollaborationModel.register();
let _view;
let users = {};
let selfstat = 0;
class CollaborationView extends View {
    constructor(model) {
        super(model);
        this.model = model;
        _view = this;
        
        abacus.on('updateNode', this.onUpdateNode);
        abacus.on('resetNode', this.onReset);
        this.subscribe(this.sessionId,"update", this.handleUpdate);
        this.subscribe(this.sessionId,"reset", this.handleReset);
        this.subscribe(this.sessionId,"new_user", this.handleNewUser);
        this.subscribe(this.sessionId,"remove_user", this.handleRemoveUser);
        this.subscribe(this.sessionId,"toggle_user", this.handleToggleUser);
        this.publish(this.sessionId,"pull_request", { id: this.viewId, name: userName, type: type });

    }

    onUpdateNode(e) {
        _view.publish(_view.sessionId,"draw_abacus", { selectedElement: e.detail, viewId:_view.viewId});
        
    }
    handleUpdate(action) {
        if (_view.viewId !== action.viewId) {
            abacus.abacusCtrl.activated(action.selectedElement);
            abacus.update();
        }
    }
    onReset() {
        _view.publish(_view.sessionId, "reset_abacus");
    }
    handleReset() {
        abacus.abacusCtrl.init();
        abacus.update();
    }
    handleNewUser(data) {
        updateUsers(data.users, data.stats);
        if (data.viewId === _view.viewId) {
            data.actions.forEach(action => {
                abacus.abacusCtrl.activated(action);
            });
            abacus.update();
        }
    }
    handleRemoveUser(data) {
        updateUsers(data.users, data.stats);
    }
    handleToggleUser(data) {
        updateUsers(data.users, data.stats);
    }
}

function updateUsers(users, stats) {
    var root = document.getElementById("users");
    while( root.firstChild ){
        root.removeChild( root.firstChild );
    }
    for (user in users) {
        var node = document.createElement("input");
        node.className = "chip white-text";
        node.type = "button";
        node.value = users[user];
        if (type !== 't' || stats[users[user]] === 2)
            node.disabled = true;
        if (stats[users[user]] === 2)
            node.style.backgroundColor = '#838915'; 
        else {
            node.onclick = function(event) {
                console.log(event.target.value);
                _view.publish(_view.sessionId,"toggle_role", event.target.value);
            };
            if (stats[users[user]] === 1)
                node.style.backgroundColor = '#28a745'; 
            else
                node.style.backgroundColor = '#6c757d';
        }
        root.appendChild(node);
    }
    selfstat = stats[userName];
    if (selfstat === 0) {
        document.getElementById("resetBtn").disabled = true;
        abacus.control = false;
    } else {
        document.getElementById("resetBtn").disabled = false;
        abacus.control = true;
    }
}
startSession(sessionName, CollaborationModel, CollaborationView);
let sharelink = document.getElementById('sharelink');
var folder = window.location.pathname;
folder = folder.substr(0, folder.lastIndexOf('/'));
let origin = window.location.origin;
if (origin.indexOf("file:") === -1 && origin.slice(-1) !== "/")
    origin += '/';
if (folder.slice(-1) !== "/")
    folder += '/';
console.log(origin);
var fixedSessionName = sessionName.replace(/ /g,"%20");
if (folder) {
    sharelink.value = `${origin}${folder}login.html?type=s&room=${fixedSessionName}&level=${abacusLevel}`;
}
else {
    sharelink.value = `${origin}login.html?type=s&room=${fixedSessionName}&level=${abacusLevel}`;
}

function onCopy() {
    sharelink.select();
    document.execCommand("copy");
    $("#shareModal").modal("hide");
}
function logout() {
    if (type === 't')
        location = "login.html";
    else 
        location = `login.html?type=s&room=${fixedSessionName}`;
}