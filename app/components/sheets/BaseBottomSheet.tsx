import React, { forwardRef, useCallback } from 'react';
import {
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BaseBottomSheetProps extends Partial<BottomSheetModalProps> {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  enablePanDownToClose?: boolean;
  showHandle?: boolean;
  backdropOpacity?: number;
  onDismiss?: () => void;
  detached?: boolean;
  bottomInset?: number;
  footerComponent?: React.ComponentType<any>;
}

export const BaseBottomSheet = forwardRef<BottomSheetModal, BaseBottomSheetProps>(
  (
    {
      children,
      snapPoints = ['50%', '90%'],
      index = 0,
      enablePanDownToClose = true,
      showHandle = true,
      backdropOpacity = 0.5,
      onDismiss,
      detached = false,
      bottomInset,
      footerComponent,
      ...props
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 60;

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          opacity={backdropOpacity}
          enableTouchThrough={false}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      [backdropOpacity]
    );

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1 && onDismiss) {
          onDismiss();
        }
      },
      [onDismiss]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        enablePanDownToClose={enablePanDownToClose}
        handleIndicatorStyle={
          showHandle
            ? {
                backgroundColor: Colors.neutral.mist,
                width: 40,
                height: 4,
              }
            : { display: 'none' }
        }
        keyboardBehavior={props.keyboardBehavior || 'interactive'}
        keyboardBlurBehavior={props.keyboardBlurBehavior || 'restore'}
        android_keyboardInputMode="adjustResize"
        topInset={insets.top}
        detached={detached}
        bottomInset={
          bottomInset !== undefined ? bottomInset : detached ? TAB_BAR_HEIGHT + insets.bottom : 0
        }
        style={
          detached
            ? {
                marginHorizontal: 16,
                shadowColor: Colors.shadows.dark,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 5,
              }
            : undefined
        }
        footerComponent={footerComponent}
        {...props}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

BaseBottomSheet.displayName = 'BaseBottomSheet';
