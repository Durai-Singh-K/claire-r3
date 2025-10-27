# Simplified Fashion Trend Dashboard Service
# This runs the Dash app from complete_dashboard.py as a standalone service
import sys
import os

# Import the complete dashboard
# Since complete_dashboard.py contains all the code, we just need to run it
if __name__ == "__main__":
    print("=" * 60)
    print("FASHION TRENDS DASHBOARD SERVICE")
    print("=" * 60)
    print("\nStarting Dash application...")
    print("Dashboard will be available at: http://localhost:8051")
    print("\nFeatures:")
    print("  • Overview: Fashion trend analysis with Google Trends")
    print("  • Trends: State-wise analysis & fashion blog reports")
    print("  • Reports: Multi-timeframe comprehensive analysis")
    print("\nPress CTRL+C to stop the server")
    print("=" * 60)
    print()

    # Execute the complete dashboard
    exec(open('complete_dashboard.py').read())
