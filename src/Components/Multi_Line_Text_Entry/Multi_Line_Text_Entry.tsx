import React, { Dispatch, FunctionComponent, SetStateAction } from 'react';
import {
    InputModeOptions,
    KeyboardTypeOptions,
    TextInput,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import { fonts } from '../../Configs/Fonts/Fonts';
import { INTF_AutoComplete } from '../../Interface/Auto_Complete/Auto_Complete';

interface MultiLineTextEntryProps {
    marginTop?: number | 'auto';
    marginBottom?: number | 'auto';
    marginLeft?: number | 'auto';
    marginRight?: number | 'auto';
    inputValue: string;
    setInputValue: Dispatch<SetStateAction<string>>;
    onChange?: () => void;
    onFocus?: () => void;
    inputMode?: InputModeOptions;
    textColor?: string;
    autoFocus?: boolean;
    editable?: boolean;
    placeHolderText?: string;
    keyboardType?: KeyboardTypeOptions | undefined;
    secureTextEntry?: boolean;
    autoComplete?: INTF_AutoComplete;
    spellCheck?: boolean;
}
const MultiLineTextEntry: FunctionComponent<MultiLineTextEntryProps> = ({
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    inputValue,
    setInputValue,
    onChange,
    onFocus,
    inputMode,
    textColor,
    autoFocus,
    editable,
    placeHolderText,
    keyboardType,
    secureTextEntry,
    autoComplete,
    spellCheck,
}) => {
    return (
        <View
            style={{
                marginLeft: marginLeft || 0,
                marginRight: marginRight || 0,
                marginTop: marginTop || 0,
                marginBottom: marginBottom || 0,
                flex: 1,
                minHeight: 56,
                borderRadius: 8,
                borderColor: Colors.Border,
                borderWidth: 1,
                backgroundColor: Colors.InputBackground,
            }}>
            <TextInput
                style={{
                    flex: 1,
                    fontFamily: fonts.Urbanist_500,
                    fontSize: 16,
                    marginHorizontal: 10,
                    borderWidth: 0,
                    marginVertical: 2,
                    color: textColor || Colors.Dark,
                    textAlignVertical: 'top',
                }}
                placeholder={placeHolderText || ''}
                placeholderTextColor={Colors.Grey}
                onChangeText={(text: string) => {
                    setInputValue(text);
                    onChange !== undefined && (onChange() as unknown);
                }}
                value={inputValue}
                autoCapitalize={'none'}
                autoCorrect={false}
                inputMode={inputMode || 'text'}
                onFocus={() => onFocus !== undefined && (onFocus() as unknown)}
                autoFocus={autoFocus || false}
                editable={editable === false ? false : true}
                multiline
                spellCheck={spellCheck || false}
                keyboardType={keyboardType || 'default'}
                secureTextEntry={secureTextEntry || false}
                autoComplete={autoComplete || 'off'}
                importantForAutofill="no"
            />
        </View>
    );
};

export default MultiLineTextEntry;
