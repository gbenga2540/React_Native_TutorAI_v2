declare module '*.svg' {
    import React from 'react';
    import { SvgProps } from 'react-native-svg';
    const content: React.FC<SvgProps>;
    export default content;
}

declare module 'react-native-otp-textinput';
declare module 'react-native-image-base64';
declare module 'react-native-mdm';
