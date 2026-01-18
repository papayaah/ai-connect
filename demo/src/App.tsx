import { useState } from 'react';
import {
    AIProviderSelector,
    AIManagementProvider,
    UsageStats,
    tailwindPreset,
    useAIManagementContext,
    type AIProviderConfig,
    type CostEstimate,
} from '@reactkits.dev/react-ai-management';

function AIManagementDemo() {
    const { usageStats, resetUsageStats } = useAIManagementContext();
    const [selectedConfig, setSelectedConfig] = useState<AIProviderConfig | null>(null);

    const handleProviderSelect = (newConfig: AIProviderConfig) => {
        setSelectedConfig(newConfig);
        console.log('Provider selected:', newConfig);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        AI Management Demo
                    </h1>
                    <p className="text-gray-600">
                        Headless AI Provider Selection with Cost Tracking
                    </p>
                </header>

                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <AIProviderSelector
                        onProviderSelect={handleProviderSelect}
                        onValidationComplete={(isValid: boolean, provider: string) => {
                            console.log(`Validation for ${provider}:`, isValid);
                        }}
                        onCostEstimate={(estimate: CostEstimate) => {
                            console.log('Cost estimate:', estimate);
                        }}
                        showCostComparison={true}
                        analysesPerMonth={10}
                        preset={tailwindPreset}
                    />
                </div>

                {selectedConfig && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Selected Configuration</h2>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(selectedConfig, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
                    <UsageStats
                        stats={usageStats}
                        onReset={resetUsageStats}
                        preset={tailwindPreset}
                    />
                </div>

                <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>
                        Built with{' '}
                        <a
                            href="https://github.com/papayaah/react-ai-management"
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @reactkits.dev/react-ai-management
                        </a>
                    </p>
                </footer>
            </div>
        </div>
    );
}

function App() {
    return (
        <AIManagementProvider>
            <AIManagementDemo />
        </AIManagementProvider>
    );
}

export default App;
