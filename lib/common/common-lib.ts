import { $injector } from "./definitions/yok";

require("./appbuilder/proton-bootstrap");

module.exports = $injector.publicApi;
