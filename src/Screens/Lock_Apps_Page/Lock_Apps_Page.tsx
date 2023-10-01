import React, { FunctionComponent, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, NativeModules } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import CheckBox from '../../Components/Check_Box/Check_Box';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MobileDeviceManager from 'react-native-mdm';
import { IOSPLockStore } from '../../MobX/IOS_PLock/IOS_PLock';

const LockAppsPage: FunctionComponent = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [pControl, setPControl] = useState<boolean>(false);
    const [render, setRender] = useState<boolean>(false);

    const proceed = no_double_clicks({
        execFunc: async () => {
            if (pControl) {
                if (Platform.OS === 'android') {
                    const active =
                        await NativeModules.LockTaskModule.isLockTaskOn();

                    if (!active) {
                        await NativeModules.LockTaskModule.startLockTask();
                    }
                } else {
                    try {
                        // await NativeModules.LockAppModule.enableSingleAppMode();
                        await MobileDeviceManager.lockApp().then((_res: any) =>
                            IOSPLockStore.set_p_lock_on(),
                        );
                    } catch (error) {}
                }
            } else {
                if (Platform.OS === 'android') {
                    const active =
                        await NativeModules.LockTaskModule.isLockTaskOn();
                    if (active) {
                        await NativeModules.LockTaskModule.stopLockTask();
                    }
                } else {
                    try {
                        // await NativeModules.LockAppModule.disableSingleAppMode();
                        await MobileDeviceManager.unlockApp().then(
                            (_res: any) => IOSPLockStore.set_p_lock_off(),
                        );
                    } catch (error) {}
                }
            }
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'HomeStack',
                        },
                    ],
                }),
            );
        },
    });

    useEffect(() => {
        if (Platform.OS === 'android') {
            const check_status = async () => {
                const active =
                    await NativeModules.LockTaskModule.isLockTaskOn();
                setPControl(active || false);
                setRender(true);
            };
            check_status();
        } else {
            setPControl(IOSPLockStore.p_lock || false);
            setRender(true);
        }
    }, []);

    if (render) {
        return (
            <View style={styles.lap_main}>
                <CustomStatusBar backgroundColor={Colors.Background} />
                <View
                    style={{
                        marginTop:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 45,
                                      if_false: 65,
                                  })
                                : 30,
                        marginHorizontal: 22,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <BackButton />
                    <BasicText
                        inputText="Parental Control"
                        marginLeft={10}
                        textWeight={700}
                        textSize={20}
                    />
                </View>
                <View
                    style={{
                        flex: 1,
                        marginHorizontal: 22,
                    }}>
                    <BasicText
                        inputText="Tick the Box to Enable Parental Control"
                        marginTop={20}
                        textSize={28}
                        textWeight={700}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 20,
                        }}>
                        <BasicText inputText="Enable Parental Control?" />
                        <CheckBox
                            marginLeft={'auto'}
                            active={pControl}
                            setActive={setPControl}
                            size={24}
                        />
                    </View>
                </View>
                <BasicButton
                    buttonText="PROCEED"
                    marginHorizontal={22}
                    marginBottom={
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_true: 10,
                                  if_false: 40,
                              })
                            : 10
                    }
                    execFunc={() => proceed({})}
                />
            </View>
        );
    } else {
        return null;
    }
};

export default LockAppsPage;

const styles = StyleSheet.create({
    lap_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
