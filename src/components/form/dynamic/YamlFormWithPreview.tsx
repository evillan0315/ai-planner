import React, { useEffect, useState } from "react";
import yaml from "js-yaml";

type SchemaNode = string | number | boolean | object | Array<any>;

interface YamlFormWithPreviewProps {
  filePath: string;
  onSubmit?: () => void;
}

const YamlFormWithPreview: React.FC<YamlFormWithPreviewProps> = ({ filePath, onSubmit }) => {
  const [schema, setSchema] = useState<Record<string, SchemaNode> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const response = await fetch(filePath);
        const text = await response.text();
        const parsed =
          filePath.endsWith(".yaml") || filePath.endsWith(".yml")
            ? yaml.load(text)
            : JSON.parse(text);
        setSchema(parsed as Record<string, SchemaNode>);
        setFormData(parsed as Record<string, any>);
      } catch (err) {
        console.error("Error loading schema:", err);
      }
    };
    loadSchema();
  }, [filePath]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (path: string[], value: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      let obj: any = newData;
      path.forEach((key, idx) => {
        if (idx === path.length - 1) {
          obj[key] = value;
        } else {
          obj[key] = obj[key] ?? {};
          obj = obj[key];
        }
      });
      return newData;
    });
  };

  const handleAddItem = (path: string[]) => {
    setFormData((prev) => {
      const newData = { ...prev };
      let obj: any = newData;
      path.forEach((key, idx) => {
        if (idx === path.length - 1) {
          if (!Array.isArray(obj[key])) obj[key] = [];
          obj[key].push(""); // default empty string
        } else {
          obj[key] = obj[key] ?? {};
          obj = obj[key];
        }
      });
      return newData;
    });
  };

  const handleRemoveItem = (path: string[], index: number) => {
    setFormData((prev) => {
      const newData = { ...prev };
      let obj: any = newData;
      path.forEach((key, idx) => {
        if (idx === path.length - 1) {
          if (Array.isArray(obj[key])) obj[key].splice(index, 1);
        } else {
          obj[key] = obj[key] ?? {};
          obj = obj[key];
        }
      });
      return newData;
    });
  };

  const renderField = (key: string, value: any, path: string[] = []) => {
    const fullPath = [...path, key];

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        const sectionKey = fullPath.join(".");
        const isOpen = openSections[sectionKey] ?? true;
        return (
          <div key={sectionKey} className="border border-gray-200 rounded p-2 mb-2">
            <button
              type="button"
              onClick={() => toggleSection(sectionKey)}
              className="w-full text-left font-semibold bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              {key} {isOpen ? "▲" : "▼"} (Array)
            </button>
            {isOpen && (
              <div className="pl-4 mt-2 space-y-2">
                {value.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    {typeof item === "object" && item !== null ? (
                      <div className="flex-1 border border-gray-300 p-2 rounded">
                        {Object.entries(item).map(([childKey, childValue]) =>
                          renderField(childKey, childValue, [...fullPath, idx.toString()])
                        )}
                      </div>
                    ) : (
                      <input
                        type={typeof item === "number" ? "number" : "text"}
                        value={item}
                        onChange={(e) =>
                          handleChange(
                            [...fullPath, idx.toString()],
                            typeof item === "number" ? Number(e.target.value) : e.target.value
                          )
                        }
                        className="flex-1 border border-gray-300 rounded px-2 py-1"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(fullPath, idx)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem(fullPath)}
                  className="mt-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Item
                </button>
              </div>
            )}
          </div>
        );
      } else {
        const sectionKey = fullPath.join(".");
        const isOpen = openSections[sectionKey] ?? true;
        return (
          <div key={sectionKey} className="border border-gray-200 rounded p-2 mb-2">
            <button
              type="button"
              onClick={() => toggleSection(sectionKey)}
              className="w-full text-left font-semibold bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              {key} {isOpen ? "▲" : "▼"}
            </button>
            {isOpen && (
              <div className="pl-4 mt-2 space-y-2">
                {Object.entries(value).map(([childKey, childValue]) =>
                  renderField(childKey, childValue, fullPath)
                )}
              </div>
            )}
          </div>
        );
      }
    }

    let inputType = "text";
    if (typeof value === "number") inputType = "number";
    if (typeof value === "boolean") inputType = "checkbox";

    return (
      <div key={fullPath.join(".")} className="flex flex-col space-y-1">
        <label className="font-semibold text-gray-700">{key}</label>
        {inputType === "checkbox" ? (
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => handleChange(fullPath, e.target.checked)}
            className="w-5 h-5"
          />
        ) : (
          <input
            type={inputType}
            value={value as string | number}
            onChange={(e) =>
              handleChange(
                fullPath,
                inputType === "number" ? Number(e.target.value) : e.target.value
              )
            }
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    onSubmit(formData)
  };

  if (!schema) return <div className="text-gray-500">Loading schema...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <form
        onSubmit={handleSubmit}
        className="flex-1 bg-white shadow rounded p-6 space-y-4 overflow-auto max-h-[80vh]"
      >
        {Object.entries(formData).map(([key, value]) => renderField(key, value))}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-6 overflow-auto max-h-[80vh]">
        <h2 className="text-lg font-semibold mb-2">Live YAML Preview</h2>
        <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
          {yaml.dump(formData)}
        </pre>
      </div>
    </div>
  );
};

export default YamlFormWithPreview;

