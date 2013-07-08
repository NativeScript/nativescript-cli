// Use `promiscuous` as `Kinvey.Defer` adapter.
if('undefined' !== typeof root.promiscuous) {
  Kinvey.Defer.use(root.promiscuous);
}