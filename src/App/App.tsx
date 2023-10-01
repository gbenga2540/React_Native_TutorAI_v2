/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { FunctionComponent, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import CustomStatusBar from '../Components/Custom_Status_Bar/Custom_Status_Bar';
import { NavigationContainer } from '@react-navigation/native';
import { OnlineManager } from '../Hooks/Online_Manager/Online_Manager';
import { OnAppFocus } from '../Hooks/On_App_Focus/On_App_Focus';
import { KeyboardManager } from '../Hooks/Keyboard_Manager/Keyboard_Manager';
import { observer } from 'mobx-react';
import Colors from '../Configs/Colors/Colors';
import { HideSplashScreen } from '../Hooks/Hide_Splash_Screen/Hide_Splash_Screen';
import { SetClassSchedule } from '../Hooks/Set_Class_Schedule/Set_Class_Schedule';
import { LoadAvatarVoice } from '../Hooks/Load_Avatar_Voice/Load_Avatar_Voice';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AndroidNotification } from '../Hooks/Android_Notification/Android_Notification';
import { GetSpeechRate } from '../Hooks/Get_Speech_Rate/Get_Speech_Rate';
import { LoadAdminData } from '../Hooks/Load_Admin_Data/Load_Admin_Data';
import MainStack from '../Routes/Main_Stack/Main_Stack';
import TranslateCard from '../Components/Translate_Card/Translate_Card';
import { AdminStore } from '../MobX/Admin/Admin';
import { LoadVocabularies } from '../Hooks/Load_Vocabularies/Load_Vocabularies';
import { LoadInitInterest } from '../Hooks/Load_Init_Interest/Load_Init_Interest';

const App: FunctionComponent = observer(() => {
    useEffect(() => {
        HideSplashScreen();
        SetClassSchedule();
        LoadAvatarVoice();
        LoadVocabularies();
        GetSpeechRate();
        LoadInitInterest();
        AndroidNotification();
    }, []);

    OnlineManager();
    OnAppFocus();
    KeyboardManager();
    LoadAdminData();

    const Stripe_Key = AdminStore.admin_data?.stripe_public_key || '';

    return (
        <View style={styles.app_main}>
            <StripeProvider publishableKey={Stripe_Key}>
                <NavigationContainer>
                    <CustomStatusBar />
                    <TranslateCard />
                    <MainStack />
                </NavigationContainer>
            </StripeProvider>
        </View>
    );
});

export default App;

const styles = StyleSheet.create({
    app_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
