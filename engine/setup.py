"""Setup script for the Lapia engine package."""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="lapia",
    version="1.0.0",
    description="A batteries-included 2D game engine for Python built on Pygame",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Lapia Engine Contributors",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "pygame>=2.1.0",
        "numpy>=1.20.0",
    ],
    extras_require={
        "ai": ["numpy>=1.20.0"],
        "network": [],
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "mypy>=1.0.0",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Games/Entertainment",
        "Topic :: Software Development :: Libraries :: pygame",
    ],
    entry_points={
        "console_scripts": [
            "lapia-demo=examples.platformer:main",
        ],
    },
)
