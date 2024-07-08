const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withForegroundService = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Add meta-data items
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.antoninbeliard.loco.foregroundservice.notification_channel_name',
      'Loco Service',
      'value',
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.antoninbeliard.loco.foregroundservice.notification_channel_description',
      'Loco Service running in the background.',
      'value',
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.antoninbeliard.loco.foregroundservice.notification_color',
      '@color/orange',
      'resource',
    );

    // Add services
    mainApplication.service = mainApplication.service || [];
    mainApplication.service.push({
      $: {
        'android:name': 'com.antoninbeliard.loco.LocationService',
        'android:enabled': 'true',
        'android:exported': 'false',
        'android:foregroundServiceType': 'location',
      },
    });
    mainApplication.service.push({
      $: {
        'android:name': 'com.antoninbeliard.loco.ForegroundService',
      },
    });
    mainApplication.service.push({
      $: {
        'android:name': 'com.antoninbeliard.loco.ForegroundServiceTask',
      },
    });

    // Copy the color.xml file
    const srcFilePath = path.join(__dirname, 'color.xml');
    const resFilePath = path.join(
      await AndroidConfig.Paths.getResourceFolderAsync(config.modRequest.projectRoot),
      'values',
      'color.xml',
    );

    const resDir = path.resolve(resFilePath, '..');
    if (!fs.existsSync(resDir)) {
      await fs.promises.mkdir(resDir);
    }

    try {
      await fs.promises.copyFile(srcFilePath, resFilePath);
    } catch (e) {
      throw e;
    }

    return config;
  });
};

module.exports = withForegroundService;
