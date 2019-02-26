module.exports = {
  migrateToScopedPackages: { MIGRATE_TO_SCOPED_PACKAGES: 'true' },
  outsideCI: {
    TEAMCITY_VERSION: '',
    BUILD_NUMBER: '',
    BUILD_VCS_NUMBER: '',
    CI: '',
    CONTINUOUS_INTEGRATION: '',
    RUN_ID: '',
    GITLAB_CI: '',
  },
  insideCI: { TEAMCITY_VERSION: 1, CI: 1 },
  insideWatchMode: { WIX_NODE_BUILD_WATCH_MODE: true },
  teamCityArtifactVersion: { ARTIFACT_VERSION: '1.0.0' },
  noArtifactVersion: { ARTIFACT_VERSION: '' },
};
