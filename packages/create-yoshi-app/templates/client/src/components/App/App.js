import * as fedops from 'fedops-logger';
import React from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import s from './App.scss';

class App extends React.Component {
  static propTypes = {
    t: PropTypes.func,
  };

  // The app load event is fired from the browser before the app is loaded.
  // After the app is loaded, using the appLoaded function on the componentDidMount
  // function to notify Grafana that the app was fully loaded.
  componentDidMount() {
    const logger = fedops.logger || fedops;
    const fedopsLogger = logger.create('{%projectName%}');
    fedopsLogger.appLoaded();
  }

  render() {
    const { t } = this.props;

    return (
      <div className={s.root}>
        <div className={s.header}>
          <h2>{t('app.title')}</h2>
        </div>
        <p className={s.intro}>{t('app.intro')}</p>
      </div>
    );
  }
}

export default translate()(App);
