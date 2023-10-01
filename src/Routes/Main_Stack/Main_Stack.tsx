import React, { FunctionComponent, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from '../Auth_Stack/Auth_Stack';
import ErrorPage from '../../Screens/Error_Page/Error_Page';
import InfoPage from '../../Screens/Info_Page/Info_Page';
import HomeStack from '../Home_Stack/Home_Stack';
import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_USER_INFO } from '@env';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { INTF_UserInfo } from '../../Interface/User_Info/User_Info';
import { observer } from 'mobx-react';
import { useQuery, useQueryClient } from 'react-query';
import { get_user_info } from '../../Configs/Queries/Users/Users';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';
import { Platform, View } from 'react-native';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import Colors from '../../Configs/Colors/Colors';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';

type MainStackParamList = {
    AuthStack: {};
    HomeStack: {};
    ErrorPage: {
        error_mssg: string;
        svr_error_mssg: string;
    };
    InfoPage: {
        success_mssg: string;
        svr_success_mssg: string;
    };
};

const Main_Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack: FunctionComponent = observer(() => {
    const queryClient = useQueryClient();

    const [render, setRender] = useState<boolean>(false);
    const [tempInfo, setTempInfo] = useState<INTF_UserInfo>({});

    const { data, isError, refetch, isLoading } = useQuery(
        QueryTags({})?.UserInfo,
        () =>
            get_user_info({
                userAuth: tempInfo?.accessToken as string,
            }),
        {
            enabled: Boolean(tempInfo?.accessToken),
            refetchOnMount: true,
            refetchOnReconnect: true,
            refetchIntervalInBackground: true,
        },
    );

    const get_user_token = async () => {
        try {
            await SInfo.getItem(SECURE_STORAGE_USER_INFO, {
                sharedPreferencesName: SECURE_STORAGE_NAME,
                keychainService: SECURE_STORAGE_NAME,
            })
                .catch(err => {
                    err &&
                        UserInfoStore.set_user_info({
                            user_info: {},
                        });

                    setRender(true);
                })
                .then(async res => {
                    if (res) {
                        const json_res: { user_info: INTF_UserInfo } =
                            JSON.parse(res);
                        if (json_res?.user_info?.accessToken) {
                            setTempInfo(json_res.user_info);
                        } else {
                            UserInfoStore.set_user_info({
                                user_info: {},
                            });
                            setRender(true);
                        }
                    } else {
                        UserInfoStore.set_user_info({
                            user_info: {},
                        });
                        setRender(true);
                    }
                });
        } catch (error) {
            UserInfoStore.set_user_info({
                user_info: {},
            });
            setRender(true);
        }
    };

    const refetch_data = no_double_clicks({
        execFunc: () => {
            refetch();
            queryClient.invalidateQueries(QueryTags({}).AdminData);
        },
    });

    useEffect(() => {
        if (
            !isError &&
            !isLoading &&
            data?.error === false &&
            data?.data?.email
        ) {
            const save_data = async () => {
                const proceed = () => {
                    UserInfoStore.set_user_info({
                        user_info: {
                            ...tempInfo,
                            ...data?.data,
                        },
                    });
                    if (!render) {
                        setRender(true);
                    }
                };
                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: {
                                ...tempInfo,
                                ...data?.data,
                            },
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch(err => {
                            err && proceed();
                        })
                        .then(() => {
                            proceed();
                        });
                } catch (error) {
                    proceed();
                }
            };
            save_data();
        }
    }, [data, isError, isLoading, render, tempInfo]);

    useEffect(() => {
        get_user_token();
    }, []);

    if (isLoading && !render) {
        return (
            <View
                style={{
                    zIndex: 3,
                    flex: 1,
                    backgroundColor: Colors.Background,
                }}>
                <OverlaySpinner showSpinner={true} hideBackButton />
            </View>
        );
    }

    if (!isLoading && (isError || data?.error) && !render) {
        return (
            <View
                style={{
                    zIndex: 2,
                    flex: 1,
                    backgroundColor: Colors.Background,
                }}>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText="An Error Occured! Please make sure your are connected to the Internet and Try Again!"
                        width={270}
                        textAlign={'center'}
                    />
                </View>
                <BasicButton
                    execFunc={() => refetch_data({})}
                    buttonText="RELOAD"
                    marginHorizontal={22}
                    marginBottom={
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_false: 35,
                                  if_true: 10,
                              })
                            : 20
                    }
                />
            </View>
        );
    }

    if (render) {
        return (
            <Main_Stack.Navigator
                initialRouteName={
                    UserInfoStore?.user_info?._id
                        ? UserInfoStore?.user_info?.verified &&
                          UserInfoStore?.user_info?.password
                            ? UserInfoStore?.user_info?.level !== null
                                ? UserInfoStore?.user_info?.language
                                    ? 'HomeStack'
                                    : 'AuthStack'
                                : 'AuthStack'
                            : 'AuthStack'
                        : 'AuthStack'
                }
                screenOptions={{
                    headerShown: false,
                }}>
                <Main_Stack.Screen name="AuthStack" component={AuthStack} />
                <Main_Stack.Screen name="HomeStack" component={HomeStack} />
                <Main_Stack.Screen
                    name="ErrorPage"
                    component={ErrorPage}
                    options={{
                        headerShown: false,
                    }}
                />
                <Main_Stack.Screen
                    name="InfoPage"
                    component={InfoPage}
                    options={{
                        headerShown: false,
                    }}
                />
            </Main_Stack.Navigator>
        );
    } else {
        return null;
    }
});

export default MainStack;
