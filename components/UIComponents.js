import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function WasteTypeCard({ wasteType, onPress, isSelected = false }) {
  return (
    <TouchableOpacity
      className={`rounded-xl p-4 items-center ${
        isSelected ? 'border-2' : 'bg-white'
      }`}
      style={isSelected ? { borderColor: wasteType.color } : {}}
      onPress={onPress}
    >
      <Text className="text-3xl mb-2">{wasteType.icon}</Text>
      <Text className="text-gray-800 font-semibold text-center">
        {wasteType.name}
      </Text>
    </TouchableOpacity>
  );
}

export function CollectionCard({ collection, wasteType, onDelete }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm">
      <View 
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: wasteType?.color + '20' }}
      >
        <Text className="text-2xl">{wasteType?.icon || '♻️'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold text-base">
          {wasteType?.name || 'Unknown'}
        </Text>
        <Text className="text-gray-600 text-sm">
          {formatDate(collection.date)}
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity 
          className="bg-red-100 rounded-lg p-2"
          onPress={() => onDelete(collection)}
        >
          <Text className="text-red-600 font-semibold">Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SettingCard({ icon, title, description, onPress, children }) {
  return (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-center">
        {icon && (
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
            <Text className="text-xl">{icon}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-gray-800 font-semibold text-base">{title}</Text>
          {description && (
            <Text className="text-gray-600 text-sm mt-1">{description}</Text>
          )}
        </View>
        {onPress && <Text className="text-gray-400 text-xl">›</Text>}
      </View>
      {children && <View className="mt-3">{children}</View>}
    </TouchableOpacity>
  );
}

export function InfoCard({ type = 'info', title, message }) {
  const colors = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', titleText: 'text-blue-800' },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', titleText: 'text-green-800' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', titleText: 'text-yellow-800' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', titleText: 'text-red-800' },
  };

  const colorScheme = colors[type] || colors.info;

  return (
    <View className={`${colorScheme.bg} rounded-xl p-4 border ${colorScheme.border}`}>
      <Text className={`${colorScheme.titleText} font-semibold mb-1`}>{title}</Text>
      <Text className={`${colorScheme.text} text-sm`}>{message}</Text>
    </View>
  );
}

export function StatCard({ value, label, icon, color = '#10b981' }) {
  return (
    <View className="bg-white rounded-xl p-4 items-center shadow-sm">
      <View 
        className="w-16 h-16 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: color + '20' }}
      >
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-800">{value}</Text>
      <Text className="text-gray-600 text-sm">{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message, actionLabel, onAction }) {
  return (
    <View className="bg-white rounded-xl p-6 items-center">
      <Text className="text-5xl mb-3">{icon}</Text>
      <Text className="text-gray-800 font-semibold text-lg mb-2">{title}</Text>
      <Text className="text-gray-600 text-center mb-4">{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity 
          className="bg-primary rounded-lg px-6 py-3"
          onPress={onAction}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
