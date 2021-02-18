/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component, Fragment } from 'react';
import { Platform, StyleSheet, TouchableHighlight, Text, Image, View, Linking, StatusBar, SafeAreaView } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper'
//import WebView from 'rn-webview';
import {WebView} from 'react-native-webview';
import axios from 'axios';
import firebase from 'react-native-firebase';
import { Notification } from 'react-native-firebase';
import { RemoteMessage } from 'react-native-firebase';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

const MARKET_URL = {
  'shinhan-sr-ansimclick': 'https://itunes.apple.com/app/id572462317', // 신한 앱카드
  'hdcardappcardansimclick': 'https://itunes.apple.com/kr/app/id702653088', // 현대카드 앱카드
  'citimobileapp': 'https://itunes.apple.com/kr/app/id1179759666', // 시티은행 앱카드
  'shinsegaeeasypayment': 'https://itunes.apple.com/app/id666237916', // 신세계 SSGPAY
  'lpayapp': 'https://itunes.apple.com/kr/app/id1036098908', // 롯데 L.pay
  'lottesmartpay': 'https://itunes.apple.com/kr/app/id668497947', // 롯데 모바일결제
  'kpay': 'https://itunes.apple.com/app/id911636268', // Kpay
  'ispmobile': 'https://itunes.apple.com/kr/app/id369125087', // ISP/페이북
  'kb-acp': 'https://itunes.apple.com/kr/app/id695436326', // KB국민 앱카드
  'mpocket.online.ansimclick': 'https://itunes.apple.com/kr/app/id535125356', // 삼성앱카드
  'lotteappcard': 'https://itunes.apple.com/kr/app/id688047200', // 롯데 앱카드
  'nhallonepayansimclick': 'https://itunes.apple.com/kr/app/id1177889176', // NH농협카드 올원페이(앱카드)
  'cloudpay': 'https://itunes.apple.com/kr/app/id847268987', // 하나1Q페이(앱카드)
  'lguthepay': 'https://itunes.apple.com/kr/app/id760098906', // 페이나우
  'kftc-bankpay': 'https://itunes.apple.com/kr/app/id398456030'  // 뱅크페이
};

let Props = {};
const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta);return true;`;
const WEBVIEW = 'webView';

let limit = 15;
let itv = undefined;

export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://garamfood.net/',
      outlink_url: '',
      vWebView: true,
      vOutlink: false,
      vNavigation: false,
      isLike: false,
      webviewUrl: 'https://garamfood.net',
      scrollEnable: true,
      username: 'guest',
      token: '',
      isInicis: false
    };
    this.onWebViewMessage = this.onWebViewMessage.bind(this);
  }

  componentDidMount() {
    // StatusBar.setBackgroundColor('white');
    // StatusBar.setBarStyle('dark-content');

    firebase.messaging().getToken()
      .then(fcmToken => {
        console.log('fcmToken', fcmToken)
        if (fcmToken) {
          // user has a device token
          this.state.token = fcmToken;
          axios.post(`${this.state.url}api/public/fcm_token`, {
            username: this.state.username,
            token: fcmToken,
            device: 'ios'
          }).then(res => {
            console.log('token', res);
          });

        } else {
          // user doesn't have a device token yet
        }
      });

    firebase.messaging().hasPermission()
      .then(enabled => {
        if (enabled) {
          // user has permissions
          console.log('fire base enabled:', enabled);
        } else {
          // user doesn't have permission
          console.log('fire base disabled:');
          firebase.messaging().requestPermission()
            .then(() => {
              // User has authorised
              console.log('fire base new request');
            })
            .catch(error => {
              // User has rejected permissions
              console.log('fire base', error);
            });
        }
      });

    /*this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
      // Process your token as required
      console.log('ref token', fcmToken);
    });

    this.messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
      // Process your message as required
      alert(message.getNotification().getTitle(), message.getNotification().getBody());
    });*/

    // 푸시 수신
    this.notificationListener = firebase.notifications().onNotification((notification: Notification) => {
      // Process your notification as required
      const localNotification = new firebase.notifications.Notification()
        .setNotificationId(notification.notificationId)
        .setTitle(notification.title)
        .setSubtitle(notification.subtitle)
        .setBody(notification.body)
        .setData(notification.data)
        .ios.setBadge(notification.ios.badge);

      // 수신된 푸시를 노티피로 띄움
      firebase.notifications()
        .displayNotification(localNotification)
        .catch(err => console.error(err));
    });

    // 노티피 표시될때 이벤트
    this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {
      // Process your notification as required
      // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
      console.log('noti_: ', notification.data.page);
    });

    // 노티피 열때
    this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
      //const action = notificationOpen.action;
      const notification: Notification = notificationOpen.notification;

      let page = notification.data.page;
      console.log(page)
      if (page.indexOf(this.state.url) > -1 || page.indexOf('http') === -1) {
        if (page.indexOf('http') === -1) {
          page = this.state.url + page;
        }
        console.log('인링크', page)
        this.setState({
          webviewUrl: this.state.url
        })
        this.setState({
          webviewUrl: page
        });

      }
      else {
        console.log('아웃링크', page);
        this.webview.stopLoading();
        //console.log("**URL**", url);
        this.setState({ vOutlink: true });
        this.setState({ outlink_url: page });
      }


      // if (url.indexOf(this.state.url) === -1 &&
      //   url.indexOf('facebook.com') === -1 &&
      //   url.indexOf('kauth.kakao.com') === -1 &&
      //   url.indexOf('accounts.kakao.com') === -1 &&
      //   url.indexOf('nid.naver.com') === -1 &&
      //   url.indexOf('postMessage') === -1
      // ) {
      //
      // }
    });

    Linking.addEventListener('url', (e) => {
      // do something with the url, in our case navigate(route)
      this.setState({
        webviewUrl: 'https://garamfood.net'
      });
      setTimeout(() => {
        this.setState({
          webviewUrl: e.url.replace('garam://action?path=', 'https://garamfood.net')
        });
      }, 300);

      console.log('handleOpenUrl', this.state.webviewUrl);
    });
  }

  componentWillUnmount() {
    this.notificationDisplayedListener();
    this.notificationListener();
    this.notificationOpenedListener();

    Linking.removeEventListener('url', (e) => {
      // do something with the url, in our case navigate(route)
      this.setState({
        webviewUrl: ''
      });
      setTimeout(() => {
        this.setState({
          webviewUrl: e.url.replace('garam://action?path=', 'https://garamfood.net')
        });
      }, 300);
      console.log('handleOpenUrl', this.state.webviewUrl);
    });
  }

  onBack() {
    this.webview_outlink.goBack();
  }

  _onBack() {
    this.webview.goBack();
  }

  onForward() {
    this.webview_outlink.goForward();
  }

  _cancelWebView() {
    // this.setState({ vWebView: true });
    console.log('cancel webview')
    this.setState({ vOutlink: false });
    this.setState({ outlink_url: '' });
  }

  isOutlink(url) {
    // if (
    //   url.indexOf('inicis') > -1 ||
    //   url.indexOf('facebook.com') > -1 ||
    //   url.indexOf('accounts.kakao.com') > -1 ||
    //   url.indexOf('nid.naver.com') > -1) {
    //   console.log('소셜임', url)
    //   return false;
    // }
    if (url.indexOf('http') === -1 ||
      url.indexOf('kakaolink') > -1) {
      console.log('소셜아님 isOutlink true', url)
      return true;
    } else {
      console.log('isOutlink else')
      if(url.indexOf('http')>-1) {
        if(url.indexOf('inicis')>-1 || url.indexOf('vpay')>-1
          || url.indexOf('ansimclick')>-1
          || url.indexOf('vbv.')>-1
          || url.indexOf('kbcard')>-1
          || url.indexOf('acs.')>-1
          || url.indexOf('sps.')> -1
          || url.indexOf('lottecard')>-1
          || url.indexOf('hanacard')>-1
          || url.indexOf('payco')>-1
          || url.indexOf('lpay')>-1
          || url.indexOf('ssgpay')>-1
          || url.indexOf('chai')>-1
          || url.indexOf('pay.')>-1
          || url.indexOf('citibank')>-1) {
          return false;
        }
        else {
          return true;
        }
      }
      else {
        console.log('isoutlink false')
        return false;
      }
      
    }
  }

  handleDataReceived(msgData) {
    //console.log('메시지 데이타', msgData);
    //this.webview.postMessage(JSON.stringify(msgData));
  }

  onWebViewMessage(event) {
    let data = decodeURI(decodeURI(event.nativeEvent.data)).replace(/%3A/g, ':').replace(/%40/g, '@').replace(/%2C/g, ',');
    console.log("Message received from webview", data);
    if (data === 'slide') {
      this.setState({ scrollEnable: false });
      setTimeout(() => {
        this.setState({ scrollEnable: true });
      }, 1000);
      return;
    }

    data = JSON.parse(data);

    if (data.username) {
      this.setState(data);
      if (data.token) axios.defaults.headers['Authorization'] = 'Token ' + data.token;
      console.log('테스트', data.username, this.state.token);

      axios.post(`${this.state.url}api/public/fcm_token`, {
        username: data.username,
        token: this.state.token,
        device: 'ios'
      }).then(res => {
        console.log('token', res);
      });
      /*
        if(data.id)
          this.productIsLike(data.id);
      */
    }

    let msgData;
    try {
      msgData = JSON.parse(data);
    } catch (err) {
      console.warn(err);
      return;
    }

    switch (msgData.targetFunc) {
      case "handleDataReceived":
        this[msgData.targetFunc].apply(this, [msgData]);
        break;
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {isIphoneX() ? <View style={styles.containerTopNotch}></View> : <View style={styles.containerTop}></View>}

        <WebView
          ref={(ref) => { this.webview = ref; }}
          source={{ uri: this.state.webviewUrl }}
          originWhitelist={['*']}
          injectedJavaScript={INJECTEDJAVASCRIPT}
          onMessage={this.onWebViewMessage}
          bounces={false}
          scalesPageToFit={true}
          scrollEnabled={this.state.scrollEnable}
          javaScriptEnabled={true}
          startInLoadingState={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          
          onLoadStart={(event) => {
            const { url } = event.nativeEvent;

            const splittedScheme = url.split('://');
            const scheme = splittedScheme[0];
            console.log('webViewEvent scheme', scheme);
            
            if (scheme !== "http" && scheme !== "https" && scheme !== "about:blank") {
              console.log('webViewEvent', url);
              this.setState({
                marketUrl: scheme === 'itmss' ? `https://${splittedScheme[1]}` : MARKET_URL[scheme]
              });

              this.webview.stopLoading();
              Linking.openURL(url);
            }

          }}
          onShouldStartLoadWithRequest={event => {
            console.log('onShouldStartLoadWithRequest', event.url, event)
            if (event.url.indexOf('http') === -1) {
              console.log('not http')
              if (event.url.indexOf('tel:') > -1) {
                console.log('tel')
                // Linking.openURL(event.url);
              }
              Linking.openURL(event.url);
              console.log('not tel')
              return false;
            }
            else {
              console.log('http')
              // if (event.url.indexOf('bcAppPay') > -1) {
              //   Linking.openURL(event.url);
              // }
              return true;
            }
          }
          }
          onNavigationStateChange={(state) => {
            const { url } = state;
            console.log('load start - -- ', url);

            // 소셜 로그인 -> 인앱으로 뜨게 하기 위해 vNavigation만 처리
            if (
              (url.indexOf('kauth.kakao.com') > -1 ||
                url.indexOf('facebook.com') > -1 ||
                url.indexOf('accounts.kakao.com') > -1 ||
                url.indexOf('apple.com') > -1 ||
                url.indexOf('nid.naver.com') > -1) &&
              url.indexOf('postMessage') === -1 
            ) {
              //this.webview.stopLoading();
              console.log('소셜 로그인 페이지 오픈', url);
              this.setState({ vNavigation: true });
              // this.setState({ outlink_url: url });
            }
            else if (url.indexOf('tel:') === 0) {
              this.webview.current.stopLoading();
              console.log('stop loading')
              Linking.openURL(url);
            }
            // 아웃링크
            else if (url !== '' && url.indexOf(this.state.url) === -1 && this.isOutlink(url)) {
              this.webview.stopLoading();
              console.log('아웃링크', url)
              Linking.openURL(url);
            }
            // bc 페이북 back
            // else if (url.indexOf('ispAcsResult')>-1 && url.indexOf('isBlockBack')>-1) {
            //   console.log('bc')
            // }
            // 클로즈
            else {
              console.log('소셜 로그인 클로즈');
              this.setState({ vOutlink: false });
              this.setState({ vNavigation: false });
            }
          }
          } />
        {
          this.state.vNavigation ? 
            <View style={{ position: 'absolute', left: 0, bottom: isIphoneX() ? 20 : 0, backgroundColor: 'white', width: '100%' }}>
            <TouchableHighlight onPress={() => this._onBack()}>
              <Image
                style={{ width: 24, height: 24, margin: 8 }}
                source={{ uri: 'https://s3.ap-northeast-2.amazonaws.com/launchpack-kkujun/media/ic_back.png' }} />
            </TouchableHighlight>
          </View> : null
        }
        {this.state.vOutlink ?
          <View style={styles.outlink}>
            <View style={{ height: 40 }}>
              <TouchableHighlight onPress={() => this._cancelWebView()}>
                <Image
                  style={{ width: 24, height: 24, margin: 8 }}
                  source={{ uri: 'https://s3.ap-northeast-2.amazonaws.com/launchpack-kkujun/media/ic_close.png' }} />
              </TouchableHighlight>
              <Text>{this.state.name}</Text>
            </View>
            <WebView
              ref={(ref) => { this.webview_outlink = ref; }}
              source={{ uri: this.state.outlink_url }}
              injectedJavaScript={INJECTEDJAVASCRIPT}
              originWhitelist={['*']}
              javaScriptEnabled={true} />
            <View style={{ flexDirection: 'row', bottom: 4 }}>
              <TouchableHighlight onPress={() => this.onBack()}>
                <Image
                  style={{ width: 24, height: 24, margin: 8 }}
                  source={{ uri: 'https://s3.ap-northeast-2.amazonaws.com/launchpack-kkujun/media/ic_back.png' }} />
              </TouchableHighlight>
              <TouchableHighlight onPress={() => this.onForward()}>
                <Image
                  style={{ width: 24, height: 24, margin: 8 }}
                  source={{ uri: 'https://s3.ap-northeast-2.amazonaws.com/launchpack-kkujun/media/ic_forward.png' }} />
              </TouchableHighlight>
            </View>
          </View>

          : null}
        {isIphoneX() ? <View style={styles.containerBottom}></View> : null}
      </View>
    );
  }
}

let container = {
  height: '100%',
  position: 'relative',
};
let containerTopNotch = {
  paddingTop: 40,
  backgroundColor: 'white'
}

let containerTop = {
  paddingTop: 20,
  backgroundColor: 'white'
}

let containerBottom = {
  paddingBottom: 20
}


const styles = StyleSheet.create({
  container: container,
  containerTop: containerTop,
  containerTopNotch: containerTopNotch,
  containerBottom: containerBottom,
  outlink: {
    marginTop: 8,
    position: 'absolute',
    top: isIphoneX() ? 40 : 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'white'
  },
});
