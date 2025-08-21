import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, LucideIcon, MinusIcon } from 'lucide-react';
import { Badge } from './badge';

function PricingTable({ className, ...props }: React.ComponentProps<'table'>) {
	return (
		<div
			data-slot="table-container"
			className="relative w-full overflow-x-auto"
		>
			<table className={cn('w-full text-sm', className)} {...props} />
		</div>
	);
}

function PricingTableHeader({ ...props }: React.ComponentProps<'thead'>) {
	return <thead data-slot="table-header" {...props} />;
}

function PricingTableBody({
	className,
	...props
}: React.ComponentProps<'tbody'>) {
	return (
		<tbody
			data-slot="table-body"
			className={cn('[&_tr]:divide-x [&_tr]:divide-gray-700 [&_tr]:border-b [&_tr]:border-gray-700', className)}
			{...props}
		/>
	);
}

function PricingTableRow({ ...props }: React.ComponentProps<'tr'>) {
	return <tr data-slot="table-row" {...props} />;
}

function PricingTableCell({
	className,
	children,
	...props
}: React.ComponentProps<'td'> & { children: boolean | string | number }) {
	return (
		<td
			data-slot="table-cell"
			className={cn('p-3 align-middle whitespace-nowrap text-center bg-gray-900', className)}
			{...props}
		>
			{children === true ? (
				<CheckIcon aria-hidden="true" className="size-4 mx-auto text-green-500" />
			) : children === false ? (
				<MinusIcon
					aria-hidden="true"
					className="text-gray-500 size-4 mx-auto"
				/>
			) : (
				<span className="font-medium tabular-nums text-white">{children}</span>
			)}
		</td>
	);
}

function PricingTableHead({ className, ...props }: React.ComponentProps<'th'>) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				'p-3 text-left align-middle font-medium whitespace-nowrap bg-gray-900 text-gray-300',
				className,
			)}
			{...props}
		/>
	);
}

function PricingTablePlan({
	name,
	badge,
	price,
	compareAt,
	icon: Icon,
	children,
	className,
	isPopular = false,
	...props
}: React.ComponentProps<'div'> & PricingPlanType) {
	return (
		<div
			className={cn(
				'bg-gray-800 relative overflow-hidden rounded-lg border border-gray-700 p-4 font-normal text-center',
				isPopular && 'ring-2 ring-violet-500 border-violet-500',
				className,
			)}
			{...props}
		>
			<div className="flex items-center justify-center gap-2 mb-2">
				{Icon && <Icon className="h-4 w-4 text-gray-400" />}
				<h3 className="text-gray-400 text-sm capitalize">{name}</h3>
			</div>

			{badge && (
				<div className="text-xs text-gray-500 mb-3">{badge}</div>
			)}

			<div className="mb-4">
				<div className="text-2xl font-bold text-white">{price}</div>
				{compareAt && (
					<div className="text-sm text-gray-400 line-through mt-1">
						{compareAt}
					</div>
				)}
			</div>

			<div className="relative z-10">{children}</div>
		</div>
	);
}

type PricingPlanType = {
	name: string;
	icon: LucideIcon;
	badge: string;
	price: string;
	compareAt?: string;
	isPopular?: boolean;
};

type FeatureValue = boolean | string | number;

type FeatureItem = {
	label: string;
	values: FeatureValue[];
};

export {
	type PricingPlanType,
	type FeatureValue,
	type FeatureItem,
	PricingTable,
	PricingTableHeader,
	PricingTableBody,
	PricingTableRow,
	PricingTableHead,
	PricingTableCell,
	PricingTablePlan,
};
