//
//  MyNavigationModule.m
//  TutorAI
//
//  Created by Akindeju on 7/24/23.
//

#import <Foundation/Foundation.h>
#import <React/RCTLog.h>
#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>

@interface MyNavigationModule : NSObject <RCTBridgeModule>

@end

@implementation MyNavigationModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(enableNavigation) {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
    if ([rootViewController isKindOfClass:[UINavigationController class]]) {
      UINavigationController *rootNavigationController = (UINavigationController *)rootViewController;
      rootNavigationController.navigationBar.userInteractionEnabled = YES;
    }
  });
}

RCT_EXPORT_METHOD(disableNavigation) {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
    if ([rootViewController isKindOfClass:[UINavigationController class]]) {
      UINavigationController *rootNavigationController = (UINavigationController *)rootViewController;
      rootNavigationController.navigationBar.userInteractionEnabled = NO;
    }
  });
}

@end

