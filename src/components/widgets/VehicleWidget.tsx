interface WidgetData {
  title?: string;
  category?: string;
  price?: string | number;
  description?: string;
  features?: string[];
  [key: string]: unknown;
}

export default function VehicleWidget({ data }: { data: WidgetData }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      {data.title && <h2 className="text-xl font-bold mb-2">{data.title}</h2>}
      {data.category && <p className="text-sm text-gray-600 mb-2">Category: {data.category}</p>}
      {data.price && <p className="text-lg font-semibold text-blue-600 mb-2">Price: {data.price}</p>}
      {data.description && <p className="text-gray-700 mb-3">{data.description}</p>}
      {data.features && Array.isArray(data.features) && data.features.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold text-sm mb-2">Features:</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {data.features.map((feature: string, idx: number) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
