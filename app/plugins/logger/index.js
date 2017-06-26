module.exports = (_rid, _ok, _uid, _endpoint, _message) => ({
  request: _rid,
  ok: _ok,
  userId: _uid,
  endpoint: _endpoint,
  message: _message,
});
