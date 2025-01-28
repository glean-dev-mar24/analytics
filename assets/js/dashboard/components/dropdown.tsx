/** @format */

import React, {
  CSSProperties,
  DetailedHTMLProps,
  forwardRef,
  HTMLAttributes,
  ReactNode
} from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import classNames from 'classnames'
import { Transition } from '@headlessui/react'
import {
  AppNavigationLink,
  AppNavigationTarget
} from '../navigation/use-app-navigate'
import { NavigateOptions } from 'react-router-dom'

export const DropdownSubtitle = ({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={classNames(
      'text-xs px-4 pt-2 pb-1 font-bold uppercase text-indigo-500 dark:text-indigo-400',
      className
    )}
  >
    {children}
  </div>
)

export const ToggleDropdownButton = forwardRef<
  HTMLDivElement,
  {
    variant?: 'ghost' | 'button'
    withDropdownIndicator?: boolean
    className?: string
    currentOption: ReactNode
    children: ReactNode
    onClick: () => void
    style?: CSSProperties
    dropdownContainerProps: DetailedHTMLProps<
      HTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >
  }
>(
  (
    {
      className,
      currentOption,
      withDropdownIndicator,
      children,
      onClick,
      dropdownContainerProps,
      style,
      ...props
    },
    ref
  ) => {
    const { variant } = { variant: 'button', ...props }
    const sharedButtonClass =
      'flex items-center rounded text-sm leading-tight px-2 py-2 h-9'

    const buttonClass = {
      ghost:
        'text-gray-500 hover:text-gray-800 hover:bg-gray-200 dark:hover:text-gray-200 dark:hover:bg-gray-900',
      button:
        'w-full justify-between bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-900'
    }[variant]

    return (
      <div className={className} ref={ref} style={style}>
        <button
          onClick={onClick}
          className={classNames(sharedButtonClass, buttonClass)}
          tabIndex={0}
          aria-haspopup="true"
          {...dropdownContainerProps}
        >
          <span className="truncate block font-medium">{currentOption}</span>
          {!!withDropdownIndicator && (
            <ChevronDownIcon className="hidden lg:inline-block h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2 text-gray-500" />
          )}
        </button>
        {children}
      </div>
    )
  }
)

export const DropdownMenuWrapper = forwardRef<
  HTMLDivElement,
  { innerContainerClassName?: string; children: ReactNode } & DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
>(({ children, className, innerContainerClassName, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={classNames(
        'absolute left-0 right-0 mt-2 origin-top-right z-10',
        className
      )}
    >
      <Transition
        as="div"
        show={true}
        appear={true}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        className={classNames(
          'rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 font-medium text-gray-800 dark:text-gray-200',
          innerContainerClassName
        )}
      >
        {children}
      </Transition>
    </div>
  )
})

export const DropdownLinkGroup = ({
  className,
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => (
  <div
    {...props}
    className={classNames(
      className,
      'py-1 border-gray-200 dark:border-gray-500 border-b last:border-none'
    )}
  >
    {children}
  </div>
)

export const DropdownNavigationLink = ({
  children,
  active,
  className,
  navigateOptions,
  ...props
}: AppNavigationTarget & {
  active?: boolean
  children: ReactNode
  className?: string
  onClick?: () => void
  onMouseEnter?: () => void
  navigateOptions?: NavigateOptions
}) => (
  <AppNavigationLink
    {...props}
    {...navigateOptions}
    className={classNames(
      className,
      { 'font-bold': !!active },
      'flex items-center justify-between',
      `px-4 py-2 text-sm leading-tight hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-100`
    )}
  >
    {children}
  </AppNavigationLink>
)

export const SplitButton = forwardRef<
  HTMLDivElement,
  {
    className?: string
    leftOption: ReactNode
    children: ReactNode
    onClick: () => void
    dropdownContainerProps: DetailedHTMLProps<
      HTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >
  }
>(
  (
    {
      className,
      leftOption,
      children,
      onClick,
      dropdownContainerProps
      // ...props
    },
    ref
  ) => {
    const sharedButtonClass = 'flex items-stretch text-sm leading-tight h-9'

    return (
      <div className={className} ref={ref}>
        <div className={classNames(sharedButtonClass)}>
          {leftOption}
          <button
            className={classNames(
              'transition text-md font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
              'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
              'px-2 py-2',
              'rounded-l-none',
              'border-l border-indigo-800'
            )}
            onClick={onClick}
            {...dropdownContainerProps}
            aria-haspopup="true"
          >
            <ChevronDownIcon className="block w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    )
  }
)
