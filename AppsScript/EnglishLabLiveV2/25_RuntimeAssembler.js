/**
 * English LAB LIVE v2 · isolated runtime assembler (E4/E5/E7).
 *
 * This file deliberately owns NO doPost/doGet route. Runtime construction performs
 * no schema initialization and no domain writes. Routing and any initializer call
 * remain explicit release-controlled steps.
 */
function ELV2_createRuntime(deps) {
  if (!deps || !deps.store || !deps.idempotencyStore || !deps.authAdapter ||
      !deps.contentSource || !deps.clock || !deps.concurrencyGuard ||
      typeof deps.idFactory !== 'function' || typeof deps.roomCodeFactory !== 'function' ||
      typeof deps.payloadHasher !== 'function' || typeof deps.keyHasher !== 'function' ||
      typeof deps.traceIdFactory !== 'function') {
    throw new Error('ELV2_RUNTIME_DEPS_INVALID');
  }
  if (deps.idempotencyMutationGuard && typeof deps.idempotencyMutationGuard.withMutation !== 'function') {
    throw new Error('ELV2_RUNTIME_IDEMPOTENCY_GUARD_INVALID');
  }
  if (deps.schemaInitializer && typeof deps.schemaInitializer !== 'function') {
    throw new Error('ELV2_RUNTIME_SCHEMA_INITIALIZER_INVALID');
  }

  var roomEngine = ELV2_createRoomEngine({
    store: deps.store,
    clock: deps.clock,
    concurrencyGuard: deps.concurrencyGuard,
    idFactory: deps.idFactory,
    roomCodeFactory: deps.roomCodeFactory,
    maxRoomCodeAttempts: deps.maxRoomCodeAttempts
  });
  var roundEngine = ELV2_createRoundEngine({
    store: deps.store,
    clock: deps.clock,
    concurrencyGuard: deps.concurrencyGuard,
    idFactory: deps.idFactory,
    payloadHasher: deps.payloadHasher,
    allowTestOnlyGames: deps.allowTestOnlyGames === true
  });
  var roundLifecycle = ELV2_createRoundLifecycleService({
    store: deps.store,
    clock: deps.clock,
    concurrencyGuard: deps.concurrencyGuard
  });
  var stateService = ELV2_createStateService({
    store: deps.store,
    clock: deps.clock,
    concurrencyGuard: deps.concurrencyGuard,
    allowTestOnlyGames: deps.allowTestOnlyGames === true
  });
  var contentResolver = ELV2_createContentResolver(deps.contentSource);
  var idempotencyService = ELV2_createIdempotencyService({
    store: deps.idempotencyStore,
    clock: deps.clock,
    idFactory: deps.idFactory,
    payloadHasher: deps.payloadHasher,
    keyHasher: deps.keyHasher,
    mutationGuard: deps.idempotencyMutationGuard || null
  });
  var dispatcher = ELV2_createDispatcher({
    roomEngine: roomEngine,
    roundEngine: roundEngine,
    roundLifecycle: roundLifecycle,
    stateService: stateService,
    contentResolver: contentResolver,
    idempotencyService: idempotencyService,
    clock: deps.clock,
    traceIdFactory: deps.traceIdFactory
  });

  function dispatchTransport(rawRequest) {
    try {
      var transport = ELV2_extractCampusTransportRequest(rawRequest);
      var actor = deps.authAdapter.authenticateToken(transport.token);
      return dispatcher.dispatch(transport.core_request, actor);
    } catch (error) {
      return ELV2_runtimeErrorEnvelope_(rawRequest, error, deps.clock, deps.traceIdFactory);
    }
  }

  function initializeSchema(options) {
    if (!deps.schemaInitializer) throw new Error('ELV2_SCHEMA_INITIALIZER_UNAVAILABLE');
    return deps.schemaInitializer(options || {});
  }

  return Object.freeze({
    dispatchTransport: dispatchTransport,
    initializeSchema: initializeSchema,
    dispatcher: dispatcher,
    authAdapter: deps.authAdapter,
    store: deps.store,
    idempotencyStore: deps.idempotencyStore,
    eventStore: deps.eventStore || null
  });
}

function ELV2_createAppsScriptRuntime(options) {
  options = options || {};
  var spreadsheetId = typeof options.spreadsheet_id === 'string' && options.spreadsheet_id.trim()
    ? options.spreadsheet_id.trim()
    : ((typeof SHEET_ID !== 'undefined' && SHEET_ID) ? String(SHEET_ID).trim() : '');
  if (!spreadsheetId) throw new Error('ELV2_SHEETS_ID_REQUIRED');

  // E5 default: use the same explicitly selected Campus/Apollo spreadsheet for
  // read-only curriculum resolution. The factory is lazy: runtime construction
  // performs no spreadsheet read. Tests may still inject a content_source.
  var contentSource = options.content_source ||
    (typeof ELV2_createAppsScriptApolloContentSource === 'function'
      ? ELV2_createAppsScriptApolloContentSource(spreadsheetId)
      : null);
  if (!contentSource || typeof contentSource.getByRef !== 'function') {
    throw new Error('ELV2_CONTENT_SOURCE_INVALID');
  }

  // E7: the Apps Script production factory owns the closed game allowlist.
  // The generic ELV2_createRuntime remains registry-neutral and injectable.
  ELV2_registerProductionGamePlugins();

  var driver = ELV2_createAppsScriptSheetsDriver(spreadsheetId);
  var store = ELV2_createSheetsStore(driver);
  var idempotencyStore = ELV2_createSheetsIdempotencyStore(driver);
  var eventStore = ELV2_createSheetsEventStore(driver);
  var clock = ELV2_makeClock();
  var utilities = ELV2_createAppsScriptRuntimeUtilities_();
  var lockOptions = { timeout_ms: options.lock_timeout_ms == null ? 250 : options.lock_timeout_ms };
  var concurrencyGuard = ELV2_createAppsScriptRoomConcurrencyGuard(lockOptions);
  var idempotencyMutationGuard = ELV2_createAppsScriptIdempotencyMutationGuard(lockOptions);
  var schemaMutationGuard = ELV2_createAppsScriptSchemaMutationGuard(lockOptions);
  var authAdapter = options.auth_adapter || ELV2_createAppsScriptCampusAuthAdapter();

  return ELV2_createRuntime({
    store: store,
    idempotencyStore: idempotencyStore,
    eventStore: eventStore,
    authAdapter: authAdapter,
    contentSource: contentSource,
    clock: clock,
    concurrencyGuard: concurrencyGuard,
    idempotencyMutationGuard: idempotencyMutationGuard,
    idFactory: utilities.idFactory,
    roomCodeFactory: utilities.roomCodeFactory,
    payloadHasher: utilities.payloadHasher,
    keyHasher: utilities.keyHasher,
    traceIdFactory: utilities.traceIdFactory,
    maxRoomCodeAttempts: options.max_room_code_attempts,
    allowTestOnlyGames: false,
    schemaInitializer: function (initOptions) {
      return schemaMutationGuard.withMutation('__ELV2_SCHEMA_INIT__', function () {
        var normalized = initOptions || {};
        return ELV2_initializeSheetsSchema(driver, {
          environment: typeof normalized.environment === 'string' && normalized.environment.trim()
            ? normalized.environment.trim()
            : 'UNSPECIFIED',
          now_ms: normalized.now_ms == null ? clock.nowMs() : normalized.now_ms
        });
      });
    }
  });
}

function ELV2_createAppsScriptRuntimeUtilities_() {
  if (typeof Utilities === 'undefined' || !Utilities ||
      typeof Utilities.getUuid !== 'function' || typeof Utilities.computeDigest !== 'function' ||
      typeof Utilities.base64EncodeWebSafe !== 'function' || !Utilities.DigestAlgorithm ||
      !Utilities.Charset) {
    throw new Error('ELV2_RUNTIME_UTILITIES_UNAVAILABLE');
  }

  function digestText_(text) {
    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(text),
      Utilities.Charset.UTF_8
    );
    return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
  }

  function uuid_() {
    var value = String(Utilities.getUuid() || '').trim();
    if (!value) throw new Error('ELV2_RUNTIME_UUID_INVALID');
    return value;
  }

  return Object.freeze({
    idFactory: function (kind) {
      var normalizedKind = typeof kind === 'string' && kind.trim() ? kind.trim() : 'id';
      return normalizedKind + ':' + uuid_();
    },
    roomCodeFactory: function (_) {
      var compact = uuid_().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (compact.length < 8) throw new Error('ELV2_RUNTIME_UUID_INVALID');
      return 'LAB-' + compact.slice(0, 8);
    },
    payloadHasher: function (value) {
      return digestText_(ELV2_canonicalJson(value));
    },
    keyHasher: function (value) {
      return digestText_(String(value));
    },
    traceIdFactory: function () {
      return 'trace:' + uuid_();
    }
  });
}

function ELV2_runtimeErrorEnvelope_(rawRequest, error, clock, traceIdFactory) {
  var code = ELV2_publicErrorCode_(error);
  var action = rawRequest && typeof rawRequest.action === 'string' ? rawRequest.action.slice(0, 64) : '';
  var requestId = rawRequest && typeof rawRequest.request_id === 'string' ? rawRequest.request_id.slice(0, 128) : '';
  return Object.freeze({
    ok: false,
    api_version: ELV2_API_VERSION,
    service_version: ELV2_SERVICE_VERSION,
    action: action,
    request_id: requestId,
    trace_id: traceIdFactory(),
    server_now: clock.nowMs(),
    state_revision: null,
    error: Object.freeze({
      code: code,
      message: ELV2_safeErrorMessage_(code)
    })
  });
}
