/**
 * Vendor Onboarding Admin Component
 * 
 * Admin interface for managing suppliers and products.
 * No code changes required to add new vendors.
 * 
 * Features:
 * - Add/edit suppliers
 * - Configure shipping profiles
 * - Set reliability scores
 * - Map products to suppliers
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Package,
  Truck,
  Globe,
  Settings,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Building2,
  Zap,
  Box,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SUPPLIER_TEMPLATES,
  createSupplierFromTemplate,
  validateSupplierInput,
  DEFAULT_RELIABILITY_SCORES,
  DEFAULT_SHIPPING_DAYS,
  type SourceType,
  type SupplierInput,
  type SupplierTemplate,
} from '@/lib/multiSourceCommerce';

// ============================================================================
// TYPES
// ============================================================================

type OnboardingStep = 'select-type' | 'configure' | 'review';

interface OnboardingState {
  step: OnboardingStep;
  selectedType: SourceType | null;
  supplierData: SupplierInput | null;
  errors: string[];
}

// ============================================================================
// SOURCE TYPE CARD
// ============================================================================

interface SourceTypeCardProps {
  template: SupplierTemplate;
  selected: boolean;
  onSelect: () => void;
}

const SourceTypeCard: React.FC<SourceTypeCardProps> = ({
  template,
  selected,
  onSelect,
}) => {
  const getIcon = (type: SourceType) => {
    switch (type) {
      case 'aliexpress': return <Globe className="w-5 h-5" />;
      case 'zendrop': return <Zap className="w-5 h-5" />;
      case 'us_wholesaler': return <Building2 className="w-5 h-5" />;
      case 'print_on_demand': return <Box className="w-5 h-5" />;
      case 'digital': return <Download className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all
        ${selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-slate-200 bg-white hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${selected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}
        `}>
          {getIcon(template.source_type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{template.name}</h3>
            {selected && <Check className="w-4 h-4 text-blue-500" />}
          </div>
          <p className="text-sm text-slate-500 mt-1">{template.description}</p>
          
          <div className="flex gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {template.avg_shipping_days}d shipping
            </span>
            <span>
              {template.reliability_score}% reliability
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// ============================================================================
// CONFIGURATION FORM
// ============================================================================

interface ConfigFormProps {
  template: SupplierTemplate;
  data: SupplierInput;
  onChange: (data: SupplierInput) => void;
  errors: string[];
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  template,
  data,
  onChange,
  errors,
}) => {
  const updateField = (field: keyof SupplierInput, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Please fix the following:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-600">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Basic Information</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              value={data.name || ''}
              onChange={e => updateField('name', e.target.value)}
              placeholder={template.name}
            />
          </div>
          
          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={data.contact_email || ''}
              onChange={e => updateField('contact_email', e.target.value)}
              placeholder="supplier@example.com"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="base_country">Base Country</Label>
            <Input
              id="base_country"
              value={data.base_country || template.base_country}
              onChange={e => updateField('base_country', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="api_endpoint">API Endpoint (Optional)</Label>
            <Input
              id="api_endpoint"
              value={data.api_endpoint || ''}
              onChange={e => updateField('api_endpoint', e.target.value)}
              placeholder="https://api.supplier.com"
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Performance Metrics</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reliability_score">
              Reliability Score (0-100)
            </Label>
            <Input
              id="reliability_score"
              type="number"
              min="0"
              max="100"
              value={data.reliability_score ?? template.reliability_score}
              onChange={e => updateField('reliability_score', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Higher = more reliable fulfillment
            </p>
          </div>
          
          <div>
            <Label htmlFor="avg_shipping_days">
              Average Shipping Days
            </Label>
            <Input
              id="avg_shipping_days"
              type="number"
              min="0"
              value={data.avg_shipping_days ?? template.avg_shipping_days}
              onChange={e => updateField('avg_shipping_days', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.supports_tracking ?? template.supports_tracking}
              onChange={e => updateField('supports_tracking', e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Supports Tracking</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.supports_returns ?? template.supports_returns}
              onChange={e => updateField('supports_returns', e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Supports Returns</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={data.notes || ''}
          onChange={e => updateField('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
          placeholder="Internal notes about this supplier..."
        />
      </div>

      {/* Setup Notes */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Setup Notes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {template.setup_notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ============================================================================
// REVIEW PANEL
// ============================================================================

interface ReviewPanelProps {
  template: SupplierTemplate;
  data: SupplierInput;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ template, data }) => {
  const items = [
    { label: 'Supplier Name', value: data.name },
    { label: 'Source Type', value: template.source_type },
    { label: 'Base Country', value: data.base_country },
    { label: 'Reliability Score', value: `${data.reliability_score}%` },
    { label: 'Avg Shipping Days', value: `${data.avg_shipping_days} days` },
    { label: 'Supports Tracking', value: data.supports_tracking ? 'Yes' : 'No' },
    { label: 'Supports Returns', value: data.supports_returns ? 'Yes' : 'No' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
        <div className="flex items-center gap-2 text-emerald-700">
          <Check className="w-5 h-5" />
          <span className="font-medium">Ready to add supplier</span>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg divide-y">
        {items.map(item => (
          <div key={item.label} className="flex justify-between px-4 py-3">
            <span className="text-slate-500">{item.label}</span>
            <span className="font-medium text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>

      {data.contact_email && (
        <div className="text-sm text-slate-500">
          Contact: {data.contact_email}
        </div>
      )}

      {data.notes && (
        <div className="text-sm text-slate-500">
          Notes: {data.notes}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VendorOnboarding: React.FC = () => {
  const [state, setState] = useState<OnboardingState>({
    step: 'select-type',
    selectedType: null,
    supplierData: null,
    errors: [],
  });

  const templates = Object.values(SUPPLIER_TEMPLATES).filter(
    t => t.source_type !== 'shopify' // Shopify is auto-managed
  );

  const selectedTemplate = state.selectedType 
    ? SUPPLIER_TEMPLATES[state.selectedType] 
    : null;

  const handleSelectType = (type: SourceType) => {
    const template = SUPPLIER_TEMPLATES[type];
    setState({
      step: 'configure',
      selectedType: type,
      supplierData: createSupplierFromTemplate(type),
      errors: [],
    });
  };

  const handleDataChange = (data: SupplierInput) => {
    setState(prev => ({ ...prev, supplierData: data }));
  };

  const handleContinue = () => {
    if (state.step === 'configure' && state.supplierData) {
      const validation = validateSupplierInput(state.supplierData);
      if (!validation.valid) {
        setState(prev => ({ ...prev, errors: validation.errors }));
        return;
      }
      setState(prev => ({ ...prev, step: 'review', errors: [] }));
    }
  };

  const handleBack = () => {
    if (state.step === 'configure') {
      setState({
        step: 'select-type',
        selectedType: null,
        supplierData: null,
        errors: [],
      });
    } else if (state.step === 'review') {
      setState(prev => ({ ...prev, step: 'configure' }));
    }
  };

  const handleSubmit = () => {
    // In real implementation, this would call Supabase to create the supplier
    console.log('Creating supplier:', state.supplierData);
    alert('Supplier would be created (Supabase integration needed)');
    
    // Reset
    setState({
      step: 'select-type',
      selectedType: null,
      supplierData: null,
      errors: [],
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Add New Supplier</h1>
        <p className="text-slate-500">
          Configure a new vendor for multi-source fulfillment
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {['select-type', 'configure', 'review'].map((step, index) => (
          <React.Fragment key={step}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${state.step === step 
                ? 'bg-blue-500 text-white' 
                : index < ['select-type', 'configure', 'review'].indexOf(state.step)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }
            `}>
              {index + 1}
            </div>
            {index < 2 && (
              <div className={`
                flex-1 h-1 rounded
                ${index < ['select-type', 'configure', 'review'].indexOf(state.step)
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
                }
              `} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        {state.step === 'select-type' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-800 mb-4">
              Select Supplier Type
            </h2>
            
            <div className="grid gap-3">
              {templates.map(template => (
                <SourceTypeCard
                  key={template.source_type}
                  template={template}
                  selected={state.selectedType === template.source_type}
                  onSelect={() => handleSelectType(template.source_type)}
                />
              ))}
            </div>
          </div>
        )}

        {state.step === 'configure' && selectedTemplate && state.supplierData && (
          <ConfigForm
            template={selectedTemplate}
            data={state.supplierData}
            onChange={handleDataChange}
            errors={state.errors}
          />
        )}

        {state.step === 'review' && selectedTemplate && state.supplierData && (
          <ReviewPanel
            template={selectedTemplate}
            data={state.supplierData}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        {state.step !== 'select-type' ? (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <div />
        )}

        {state.step === 'configure' && (
          <Button onClick={handleContinue}>
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {state.step === 'review' && (
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
            <Check className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>
    </div>
  );
};

export default VendorOnboarding;
