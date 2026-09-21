const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidCoreVersion(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = config.modResults.contents.replace(
                /dependencies\s*\{/,
                `configurations.all {
    resolutionStrategy {
        force 'androidx.core:core-ktx:1.15.0'
        force 'androidx.core:core:1.15.0'
    }
}

dependencies {`
            );
        }
        return config;
    });
};
