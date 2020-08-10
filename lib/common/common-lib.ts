import { injector } from "./yok";

require("./appbuilder/proton-bootstrap");

module.exports = injector.publicApi;
